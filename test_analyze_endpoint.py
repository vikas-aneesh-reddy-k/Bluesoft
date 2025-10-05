#!/usr/bin/env python3
"""
Test the analyze endpoint specifically
"""

import requests
import json
import sys

def test_analyze_endpoint():
    """Test the /analyze endpoint with a sample request"""
    
    # Test data
    test_request = {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "event_date": "2025-07-04",
        "thresholds": {
            "hot_temp": 32.0,
            "cold_temp": 0.0,
            "precipitation": 5.0,
            "wind_speed": 15.0
        }
    }
    
    print("🧪 Testing /analyze endpoint...")
    print(f"   Request: {json.dumps(test_request, indent=2)}")
    
    try:
        # Make request to backend
        response = requests.post(
            "http://localhost:8000/analyze",
            json=test_request,
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analyze endpoint working!")
            print(f"   Comfort Index: {data.get('comfort_index', 'N/A')}%")
            print(f"   Probabilities: {len(data.get('probabilities', []))} conditions")
            print(f"   Alternative Dates: {len(data.get('alternative_dates', []))} suggestions")
            print(f"   Datasets Used: {', '.join(data.get('metadata', {}).get('datasets_used', []))}")
            return True
        else:
            print(f"❌ Analyze endpoint failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running:")
        print("   python backend/main.py")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_other_endpoints():
    """Test other endpoints"""
    endpoints = [
        ("GET", "/", "Root endpoint"),
        ("GET", "/health", "Health check"),
        ("GET", "/nasa-status", "NASA status"),
        ("GET", "/data-sources", "Data sources")
    ]
    
    print("\n🔍 Testing other endpoints...")
    
    for method, endpoint, description in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"http://localhost:8000{endpoint}", timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {description}: Working")
            else:
                print(f"⚠️  {description}: Status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {description}: Backend not running")
            break
        except Exception as e:
            print(f"❌ {description}: Error - {e}")

if __name__ == "__main__":
    print("🚀 Backend Endpoint Testing")
    print("=" * 50)
    
    # Test analyze endpoint
    analyze_success = test_analyze_endpoint()
    
    # Test other endpoints
    test_other_endpoints()
    
    print("\n📋 Summary:")
    if analyze_success:
        print("✅ Main analyze endpoint is working correctly")
        print("   The 500 error should be resolved!")
    else:
        print("❌ Analyze endpoint still has issues")
        print("   Check backend logs for more details")
    
    print("\n💡 Next steps:")
    print("1. Start the backend: python backend/main.py")
    print("2. Test the frontend again")
    print("3. Check the Data Source Indicator for real NASA data status")