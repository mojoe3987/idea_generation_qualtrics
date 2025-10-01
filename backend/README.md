# Diverse Idea Generation Backend

Professional RAG-based backend for generating diverse ideas in Qualtrics studies.

## Features

- **Vector Database**: PostgreSQL with pgvector for semantic similarity
- **RAG Architecture**: Retrieval-Augmented Generation for diversity
- **Real-time Updates**: Immediate database updates after idea generation
- **Clustering Analysis**: K-means clustering to identify overused concepts
- **Professional API**: Secure, scalable, and production-ready

## Setup

### 1. Deploy to Render

1. Create account on [Render](https://render.com)
2. Create PostgreSQL database
3. Create Web Service from Git repository
4. Add environment variables

### 2. Configure Environment Variables

Set these in Render dashboard:
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Auto-populated by Render
- `API_SECRET_KEY`: Generate a secure random string

### 3. Update Qualtrics

In `qualtrics_chatbot_v2.js`, update:
```javascript
var BACKEND_API_URL = 'https://your-app.render.com';
var API_SECRET_KEY = 'your-secret-key';
var STUDY_ID = 'your_study_id';
```

## API Endpoints

### Generate Diverse Idea