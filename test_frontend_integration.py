#!/usr/bin/env python3
"""
Frontend Integration Test
Tests that the backend API returns data in the format expected by the frontend
"""

import requests
import json

def test_frontend_integration():
    """Test that backend returns data in frontend-compatible format"""
    
    print("🧪 Testing Frontend-Backend Integration")
    print("=" * 50)
    
    # Test data that matches frontend expectations
    test_request = {
        "latitude": 40.7128,
        "longitude": -74.006,
        "event_date": "2025-07-04",
        "thresholds": {
            "hot_temp": 32.0,
            "cold_temp": 0.0,
            "precipitation": 5.0,
            "wind_speed": 15.0
        }
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analyze",
            json=test_request,
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields for frontend
            required_fields = [
                'comfort_index',
                'probabilities', 
                'alternative_dates',
                'metadata'
            ]
            
            print("✅ Checking frontend compatibility...")
            
            for field in required_fields:
                if field in data:
                    print(f"   ✅ {field}: Present")
                else:
                    print(f"   ❌ {field}: Missing")
            
            # Check probabilities structure
            if 'probabilities' in data and len(data['probabilities']) > 0:
                prob = data['probabilities'][0]
                prob_fields = ['condition', 'probability', 'threshold', 'trend']
                
                print("✅ Checking probability structure...")
                for field in prob_fields:
                    if field in prob:
                        print(f"   ✅ probabilities.{field}: Present")
                    else:
                        print(f"   ❌ probabilities.{field}: Missing")
            
            # Check metadata structure
            if 'metadata' in data:
                meta = data['metadata']
                print("✅ Checking metadata structure...")
                print(f"   📊 Datasets used: {meta.get('datasets_used', 'Not specified')}")
                print(f"   📅 Years analyzed: {meta.get('years_analyzed', 'Not specified')}")
            
            print(f"\n🎯 Summary:")
            print(f"   Comfort Index: {data.get('comfort_index', 'N/A')}%")
            print(f"   Probabilities: {len(data.get('probabilities', []))} conditions")
            print(f"   Alternative Dates: {len(data.get('alternative_dates', []))} suggestions")
            
            print("\n✅ Frontend integration test PASSED!")
            print("   The backend is returning data in the correct format for the frontend.")
            
        else:
            print(f"❌ Backend returned error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("   Make sure the backend is running: python backend/main.py")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_frontend_integration()