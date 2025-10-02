from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import openai
import os
from datetime import datetime
import numpy as np
from sklearn.cluster import KMeans
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for Qualtrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')
API_SECRET_KEY = os.getenv('API_SECRET_KEY', 'your-secret-key')

# Database connection pool
def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# Initialize database schema
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Enable pgvector extension
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Create ideas table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ideas (
            id SERIAL PRIMARY KEY,
            study_id VARCHAR(100) NOT NULL,
            participant_id VARCHAR(100),
            session_id VARCHAR(100),
            idea_text TEXT NOT NULL,
            original_prompt TEXT,
            embedding vector(1536),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB
        )
    """)
    
    # Create index for vector similarity search
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ideas_embedding_idx 
        ON ideas USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    
    # Create index for study_id lookups
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ideas_study_id_idx 
        ON ideas(study_id)
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database on app startup (called by Gunicorn)
try:
    init_db()
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

# Authentication middleware
def verify_api_key(api_key):
    return api_key == API_SECRET_KEY

# Get existing ideas from database
def get_existing_ideas(study_id, limit=200):
    """Retrieve existing ideas for diversity analysis"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT idea_text, embedding, created_at
        FROM ideas 
        WHERE study_id = %s AND embedding IS NOT NULL
        ORDER BY created_at DESC
        LIMIT %s
    """, (study_id, limit))
    
    ideas = cur.fetchall()
    cur.close()
    conn.close()
    
    return ideas

# Create embedding using OpenAI
def create_embedding(text):
    """Generate embedding vector for text"""
    try:
        response = openai.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error creating embedding: {e}")
        raise

# Find crowded concept clusters
def find_crowded_clusters(ideas, n_clusters=5, min_cluster_size=3):
    """Identify overrepresented concept areas using clustering"""
    if len(ideas) < 10:
        return []
    
    # Extract embeddings
    embeddings = np.array([idea['embedding'] for idea in ideas])
    idea_texts = [idea['idea_text'] for idea in ideas]
    
    # Perform K-means clustering
    n_clusters = min(n_clusters, len(ideas) // 3)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)
    
    # Find large clusters (crowded concepts)
    crowded_clusters = []
    for cluster_id in range(n_clusters):
        cluster_indices = np.where(labels == cluster_id)[0]
        
        if len(cluster_indices) >= min_cluster_size:
            # Get representative ideas from this cluster
            cluster_ideas = [idea_texts[i] for i in cluster_indices[:3]]
            crowded_clusters.append(cluster_ideas)
    
    return crowded_clusters

# Build enhanced prompt with diversity guidance
def build_diverse_prompt(current_message, crowded_clusters):
    """Create prompt that encourages diverse idea generation"""
    if not crowded_clusters:
        return current_message
    
    avoidance_text = "\n\nTo ensure diversity, please avoid similarity to these overused concept areas:\n"
    
    for idx, cluster in enumerate(crowded_clusters[:3], 1):  # Top 3 clusters
        avoidance_text += f"\nCluster {idx} (avoid these themes):\n"
        for idea in cluster:
            avoidance_text += f"- {idea}\n"
    
    avoidance_text += "\nPlease generate a creative idea that explores a different direction."
    
    return current_message + avoidance_text

# Store new idea in database
def store_idea(study_id, participant_id, session_id, idea_text, original_prompt, embedding):
    """Save generated idea to database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO ideas 
        (study_id, participant_id, session_id, idea_text, original_prompt, embedding)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (study_id, participant_id, session_id, idea_text, original_prompt, embedding))
    
    idea_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return idea_id

# Main API endpoint with RAG toggle
@app.route('/api/generate-diverse-idea', methods=['POST'])
def generate_diverse_idea():
    """Main endpoint for generating ideas with optional RAG"""
    try:
        # Verify API key
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization', 'success': False}), 401
        
        api_key = auth_header.replace('Bearer ', '')
        if not verify_api_key(api_key):
            return jsonify({'error': 'Invalid API key', 'success': False}), 403
        
        # Parse request
        data = request.json
        current_message = data.get('currentMessage', '')
        conversation_history = data.get('conversationHistory', [])
        study_id = data.get('studyId', 'default_study')
        participant_id = data.get('participantId', 'anonymous')
        session_id = data.get('sessionId', '')
        use_rag = data.get('useRAG', True)  # Toggle RAG on/off
        
        if not current_message:
            return jsonify({'error': 'No message provided', 'success': False}), 400
        
        logger.info(f"Generating idea for study: {study_id}, participant: {participant_id}, RAG: {use_rag}")
        
        enhanced_message = current_message
        crowded_clusters = []
        
        # Only use RAG if enabled
        if use_rag:
            # Step 1: Retrieve existing ideas (RAG - Retrieval)
            existing_ideas = get_existing_ideas(study_id)
            logger.info(f"Retrieved {len(existing_ideas)} existing ideas")
            
            # Step 2: Find crowded concept clusters
            crowded_clusters = find_crowded_clusters(existing_ideas)
            logger.info(f"Found {len(crowded_clusters)} crowded clusters")
            
            # Step 3: Build enhanced prompt (RAG - Augmentation)
            enhanced_message = build_diverse_prompt(current_message, crowded_clusters)
        else:
            logger.info("RAG disabled - using baseline OpenAI generation")
        
        # Step 4: Build conversation messages for OpenAI
        messages = conversation_history.copy()
        messages.append({
            "role": "user",
            "content": enhanced_message
        })
        
        # Step 5: Generate idea (with or without RAG)
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=500,
            temperature=0.8
        )
        
        generated_idea = response.choices[0].message.content.strip()
        logger.info(f"Generated idea: {generated_idea[:100]}...")
        
        # Step 6: Create embedding and store (always store for future analysis)
        embedding = create_embedding(generated_idea)
        
        idea_id = store_idea(
            study_id=study_id,
            participant_id=participant_id,
            session_id=session_id,
            idea_text=generated_idea,
            original_prompt=current_message,
            embedding=embedding
        )
        
        logger.info(f"Stored idea with ID: {idea_id}")
        
        # Return response
        return jsonify({
            'response': generated_idea,
            'success': True,
            'idea_id': idea_id,
            'rag_enabled': use_rag,
            'clusters_avoided': len(crowded_clusters) if use_rag else 0
        })
        
    except Exception as e:
        logger.error(f"Error in generate_diverse_idea: {str(e)}")
        return jsonify({
            'error': 'Sorry, I had trouble generating an idea. Please try again.',
            'success': False
        }), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Analytics endpoint
@app.route('/api/analytics/<study_id>', methods=['GET'])
def get_analytics(study_id):
    """Get analytics for a study"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_ideas,
                COUNT(DISTINCT participant_id) as unique_participants,
                MIN(created_at) as first_idea,
                MAX(created_at) as last_idea
            FROM ideas
            WHERE study_id = %s
        """, (study_id,))
        
        stats = cur.fetchone()
        cur.close()
        conn.close()
        
        return jsonify({
            'study_id': study_id,
            'statistics': dict(stats),
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    # Run Flask app
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

# Initialize database when module is loaded (for Gunicorn)
try:
    init_db()
    logger.info("App module loaded, database ready")
except Exception as e:
    logger.error(f"Failed to initialize database on module load: {e}")