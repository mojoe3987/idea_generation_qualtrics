# Testing Guide

Test your RAG system before deploying to Qualtrics participants.

## Prerequisites

1. **Backend deployed on Render** and running
2. **Python 3.7+** installed locally
3. **Your backend URL** and **API secret key**

## Setup

Install test dependencies:

```bash
pip install -r test_requirements.txt
```

## Configuration

Update both test scripts with your credentials:

```python
BACKEND_URL = "https://your-app.onrender.com"  # Your actual Render URL
API_SECRET_KEY = "your-secret-key"  # From Render environment variables
```

## Quick Test (Recommended First)

Test with just 2 requests (one per condition):

```bash
python quick_test.py
```

**What it does:**
- ✓ Checks if backend is healthy
- ✓ Sends 1 RAG request
- ✓ Sends 1 Baseline request
- ✓ Shows generated ideas

**Expected output:**
```
✓ Backend is healthy!
✓ RAG Condition: Success!
✓ Baseline Condition: Success!
```

## Full Test

Test with 100 requests per condition:

```bash
python test_rag_comparison.py
```

**What it does:**
- Sends 100 requests to RAG condition
- Sends 100 requests to Baseline condition
- Saves all results to `test_results_TIMESTAMP.json`
- Analyzes vocabulary diversity
- Takes ~2-3 minutes to complete

**Expected output:**
```
RAG Condition: 100/100 successful
Baseline Condition: 100/100 successful
Results saved to: test_results_20250102_143022.json
```

## Analyzing Results

### View in JSON file

```json
{
  "rag_condition": {
    "total_ideas": 100,
    "ideas": [
      {
        "participant_id": 1,
        "idea": "A modular dining table with...",
        "clusters_avoided": 3
      }
    ]
  },
  "baseline_condition": {
    "total_ideas": 100,
    "ideas": [...]
  }
}
```

### Check database

View ideas in PostgreSQL:

```sql
-- RAG condition
SELECT COUNT(*) FROM ideas WHERE study_id = 'test_rag_condition';

-- Baseline condition  
SELECT COUNT(*) FROM ideas WHERE study_id = 'test_baseline_condition';

-- View sample ideas
SELECT idea_text FROM ideas WHERE study_id = 'test_rag_condition' LIMIT 10;
```

### Use Analytics API

```bash
# RAG condition stats
curl https://your-app.onrender.com/api/analytics/test_rag_condition

# Baseline condition stats
curl https://your-app.onrender.com/api/analytics/test_baseline_condition
```

## Troubleshooting

### Backend not responding
- Check Render dashboard - is service running?
- Check Render logs for errors
- Verify DATABASE_URL is connected

### Authentication errors
- API_SECRET_KEY must match Render environment variable
- Get it from: Render Dashboard → Environment → API_SECRET_KEY

### Timeout errors
- Free tier on Render may be slow on first request
- Wait 30 seconds and try again
- Consider upgrading to paid tier for better performance

### Database errors
- Check PostgreSQL is created and connected
- Verify pgvector extension is installed
- Check Render logs for SQL errors

## What to Look For

**Good signs:**
- ✓ All 100 requests succeed
- ✓ RAG shows "clusters_avoided" > 0 after ~20 ideas
- ✓ Ideas stored in database
- ✓ RAG vocabulary is more diverse than baseline

**Red flags:**
- ✗ High failure rate (>5%)
- ✗ All ideas very similar
- ✗ Timeout errors
- ✗ Database connection errors

## Next Steps

After successful testing:

1. ✓ Clear test data: `DELETE FROM ideas WHERE study_id LIKE 'test_%';`
2. ✓ Update Qualtrics JavaScript with your Render URL
3. ✓ Test with 2-3 real participants first
4. ✓ Launch full study

## Support

If tests fail, check:
1. Render deployment logs
2. Database connection
3. Environment variables (OPENAI_API_KEY, API_SECRET_KEY)
4. This README for common issues


