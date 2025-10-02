"""
Test script to compare RAG vs Baseline idea generation
Sends 100 requests to each condition and analyzes diversity
"""

import requests
import json
import time
from datetime import datetime
import random

# CONFIGURATION - UPDATE THESE
BACKEND_URL = "https://your-app.onrender.com"  # Your Render backend URL
API_SECRET_KEY = "your-secret-key"  # Your API secret key

# Test prompts for dining table ideas
TEST_PROMPTS = [
    "Generate a creative dining table idea",
    "Create an innovative dining table design",
    "Design a unique dining table concept",
    "Suggest a novel dining table idea",
    "Come up with a creative dining table solution",
    "Generate a dining table idea for modern homes",
    "Create a dining table design that stands out",
    "Propose an interesting dining table concept"
]

def send_idea_request(study_id, use_rag, participant_num, prompt):
    """Send a single idea generation request"""
    url = f"{BACKEND_URL}/api/generate-diverse-idea"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_SECRET_KEY}"
    }
    
    payload = {
        "currentMessage": prompt,
        "conversationHistory": [],
        "studyId": study_id,
        "participantId": f"test_participant_{participant_num}",
        "sessionId": f"test_session_{participant_num}_{int(time.time())}",
        "useRAG": use_rag
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

def run_test(condition_name, study_id, use_rag, num_requests=100):
    """Run test for one condition"""
    print(f"\n{'='*60}")
    print(f"Testing {condition_name} (RAG={use_rag})")
    print(f"{'='*60}\n")
    
    results = []
    start_time = time.time()
    
    for i in range(1, num_requests + 1):
        # Rotate through test prompts
        prompt = random.choice(TEST_PROMPTS)
        
        print(f"[{i}/{num_requests}] Sending request for participant {i}...")
        
        result = send_idea_request(study_id, use_rag, i, prompt)
        
        if result and result.get('success'):
            idea = result.get('response', '')
            idea_id = result.get('idea_id', '')
            clusters_avoided = result.get('clusters_avoided', 0)
            
            results.append({
                'participant_id': i,
                'prompt': prompt,
                'idea': idea,
                'idea_id': idea_id,
                'clusters_avoided': clusters_avoided,
                'timestamp': datetime.now().isoformat()
            })
            
            print(f"✓ Success! Idea ID: {idea_id}, Clusters avoided: {clusters_avoided}")
            print(f"  Idea preview: {idea[:100]}...")
        else:
            print(f"✗ Failed to generate idea")
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.5)
    
    elapsed_time = time.time() - start_time
    
    print(f"\n{'-'*60}")
    print(f"Completed {len(results)}/{num_requests} requests")
    print(f"Total time: {elapsed_time:.2f} seconds")
    print(f"Average time per request: {elapsed_time/num_requests:.2f} seconds")
    print(f"{'-'*60}\n")
    
    return results

def save_results(rag_results, baseline_results):
    """Save results to JSON file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    output = {
        'test_date': datetime.now().isoformat(),
        'rag_condition': {
            'total_ideas': len(rag_results),
            'ideas': rag_results
        },
        'baseline_condition': {
            'total_ideas': len(baseline_results),
            'ideas': baseline_results
        }
    }
    
    filename = f"test_results_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Results saved to: {filename}")
    return filename

def analyze_results(rag_results, baseline_results):
    """Basic analysis of diversity"""
    print(f"\n{'='*60}")
    print("ANALYSIS SUMMARY")
    print(f"{'='*60}\n")
    
    print(f"RAG Condition:")
    print(f"  - Total ideas: {len(rag_results)}")
    if rag_results:
        avg_clusters = sum(r['clusters_avoided'] for r in rag_results) / len(rag_results)
        print(f"  - Avg clusters avoided: {avg_clusters:.2f}")
    
    print(f"\nBaseline Condition:")
    print(f"  - Total ideas: {len(baseline_results)}")
    print(f"  - Clusters avoided: 0 (RAG disabled)")
    
    # Calculate unique word diversity (simple metric)
    def get_unique_words(results):
        all_words = set()
        for r in results:
            words = r['idea'].lower().split()
            all_words.update(words)
        return len(all_words)
    
    if rag_results and baseline_results:
        rag_unique_words = get_unique_words(rag_results)
        baseline_unique_words = get_unique_words(baseline_results)
        
        print(f"\nVocabulary Diversity:")
        print(f"  - RAG: {rag_unique_words} unique words")
        print(f"  - Baseline: {baseline_unique_words} unique words")
        print(f"  - Difference: {rag_unique_words - baseline_unique_words} words")
    
    print(f"\n{'='*60}\n")

def main():
    """Main test execution"""
    print("\n" + "="*60)
    print("RAG vs Baseline Comparison Test")
    print("="*60)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Requests per condition: 100")
    print(f"\nStarting in 3 seconds...")
    time.sleep(3)
    
    # Test RAG condition
    rag_results = run_test(
        condition_name="RAG Condition (Diverse Ideas)",
        study_id="test_rag_condition",
        use_rag=True,
        num_requests=100
    )
    
    print("\n⏳ Waiting 5 seconds before baseline test...\n")
    time.sleep(5)
    
    # Test Baseline condition
    baseline_results = run_test(
        condition_name="Baseline Condition (Normal AI)",
        study_id="test_baseline_condition",
        use_rag=False,
        num_requests=100
    )
    
    # Save and analyze results
    save_results(rag_results, baseline_results)
    analyze_results(rag_results, baseline_results)
    
    print("\n✓ Test completed successfully!")
    print("\nNext steps:")
    print("1. Check the test_results_*.json file for all generated ideas")
    print("2. Review your Render logs for any errors")
    print("3. Check your PostgreSQL database to verify ideas were stored")
    print("4. Analyze diversity using the /api/analytics endpoints\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


