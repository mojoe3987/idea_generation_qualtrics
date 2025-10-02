"""
Quick test script - sends just 10 requests to each condition
Use this for faster testing before running the full 100-request test
"""

import requests
import json
import time

# CONFIGURATION - UPDATE THESE
BACKEND_URL = "https://your-app.onrender.com"  # Your Render backend URL
API_SECRET_KEY = "your-secret-key"  # Your API secret key

def test_single_request(use_rag):
    """Test a single request"""
    condition = "RAG" if use_rag else "Baseline"
    print(f"\n{'='*50}")
    print(f"Testing {condition} condition...")
    print(f"{'='*50}")
    
    url = f"{BACKEND_URL}/api/generate-diverse-idea"
    
    payload = {
        "currentMessage": "Generate a creative dining table idea",
        "conversationHistory": [],
        "studyId": f"quick_test_{condition.lower()}",
        "participantId": "test_user",
        "sessionId": "test_session",
        "useRAG": use_rag
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_SECRET_KEY}"
    }
    
    try:
        print("Sending request...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get('success'):
            print(f"✓ Success!")
            print(f"\nGenerated Idea:")
            print(f"{result['response']}")
            print(f"\nMetadata:")
            print(f"  - Idea ID: {result.get('idea_id')}")
            print(f"  - RAG Enabled: {result.get('rag_enabled')}")
            print(f"  - Clusters Avoided: {result.get('clusters_avoided', 0)}")
            return True
        else:
            print(f"✗ Failed: {result.get('error')}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")
        return False

def test_health_check():
    """Test if backend is responding"""
    print("\n" + "="*50)
    print("Testing Backend Health...")
    print("="*50)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        response.raise_for_status()
        result = response.json()
        
        print(f"✓ Backend is healthy!")
        print(f"  Status: {result.get('status')}")
        print(f"  Timestamp: {result.get('timestamp')}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Backend health check failed: {e}")
        return False

def main():
    print("\n" + "="*50)
    print("QUICK TEST - RAG vs Baseline")
    print("="*50)
    print(f"\nBackend: {BACKEND_URL}")
    
    # Test health first
    if not test_health_check():
        print("\n⚠ Backend is not responding. Please check your Render deployment.")
        return
    
    # Test RAG condition
    rag_success = test_single_request(use_rag=True)
    
    time.sleep(2)
    
    # Test Baseline condition
    baseline_success = test_single_request(use_rag=False)
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    print(f"RAG Condition: {'✓ PASS' if rag_success else '✗ FAIL'}")
    print(f"Baseline Condition: {'✓ PASS' if baseline_success else '✗ FAIL'}")
    
    if rag_success and baseline_success:
        print("\n✓ All tests passed! System is working correctly.")
        print("\nYou can now run the full test with:")
        print("  python test_rag_comparison.py")
    else:
        print("\n⚠ Some tests failed. Check your configuration:")
        print("  1. BACKEND_URL is correct")
        print("  2. API_SECRET_KEY matches your Render environment variable")
        print("  3. Backend is deployed and running on Render")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


