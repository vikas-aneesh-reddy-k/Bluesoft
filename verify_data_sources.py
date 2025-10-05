#!/usr/bin/env python3
"""
Data Source Verification Script
Will It Rain On My Parade? - NASA Space Apps Challenge 2025

This script helps you verify which data sources are real vs simulated.
Run this to confirm the current status of your data integration.
"""

import requests
import json
from datetime import datetime
import sys

def check_backend_status():
    """Check if the backend is running and get data source status"""
    try:
        response = requests.get("http://localhost:8000/data-sources", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Start it with: python backend/main.py")
        return None
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return None

def check_real_weather_api():
    """Test the real weather API"""
    try:
        # Test with New York coordinates
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "✅ REAL",
                "temperature": f"{data['current']['temperature_2m']}°C",
                "humidity": f"{data['current']['relative_humidity_2m']}%",
                "wind": f"{data['current']['wind_speed_10m']} m/s",
                "timestamp": data['current']['time']
            }
        else:
            return {"status": "❌ FAILED", "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"status": "❌ FAILED", "error": str(e)}

def test_analysis_endpoint():
    """Test the weather analysis endpoint"""
    try:
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
        
        response = requests.post(
            "http://localhost:8000/analyze",
            json=test_request,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "✅ WORKING",
                "comfort_index": data.get("comfort_index", "N/A"),
                "probabilities_count": len(data.get("probabilities", [])),
                "datasets_used": data.get("metadata", {}).get("datasets_used", [])
            }
        else:
            return {"status": "❌ FAILED", "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"status": "❌ FAILED", "error": str(e)}

def main():
    print("🚀 Will It Rain On My Parade? - Data Source Verification")
    print("=" * 60)
    print(f"Verification Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check backend status
    print("1. Checking Backend Status...")
    backend_data = check_backend_status()
    
    if backend_data:
        print("✅ Backend is running")
        verification = backend_data.get("verification", {})
        print(f"   Real data sources: {verification.get('real_data_sources', 0)}")
        print(f"   Simulated data sources: {verification.get('simulated_data_sources', 0)}")
        print(f"   NASA integration status: {verification.get('nasa_integration_status', 'unknown')}")
        print()
        
        # Show detailed data sources
        print("2. Data Source Details:")
        for source in backend_data.get("data_sources", []):
            status_icon = "🌐" if source["status"] == "real" else "🔬"
            print(f"   {status_icon} {source['name']}: {source['status'].upper()}")
            print(f"      Provider: {source['provider']}")
            if source.get("note"):
                print(f"      Note: {source['note']}")
        print()
    else:
        print("❌ Cannot connect to backend")
        print("   Make sure to run: python backend/main.py")
        return
    
    # Test real weather API
    print("3. Testing Real Weather API...")
    weather_result = check_real_weather_api()
    print(f"   Status: {weather_result['status']}")
    if weather_result['status'] == "✅ REAL":
        print(f"   Current NYC Weather: {weather_result['temperature']}, {weather_result['humidity']} humidity")
        print(f"   Wind: {weather_result['wind']}")
        print(f"   Updated: {weather_result['timestamp']}")
    else:
        print(f"   Error: {weather_result.get('error', 'Unknown error')}")
    print()
    
    # Test analysis endpoint
    print("4. Testing Weather Analysis...")
    analysis_result = test_analysis_endpoint()
    print(f"   Status: {analysis_result['status']}")
    if analysis_result['status'] == "✅ WORKING":
        print(f"   Comfort Index: {analysis_result['comfort_index']}%")
        print(f"   Probabilities calculated: {analysis_result['probabilities_count']}")
        print(f"   Datasets referenced: {', '.join(analysis_result['datasets_used'])}")
    else:
        print(f"   Error: {analysis_result.get('error', 'Unknown error')}")
    print()
    
    # Summary
    print("📊 VERIFICATION SUMMARY")
    print("-" * 30)
    
    real_weather = weather_result['status'] == "✅ REAL"
    backend_working = backend_data is not None
    analysis_working = analysis_result['status'] == "✅ WORKING"
    
    if real_weather and backend_working and analysis_working:
        print("✅ ALL SYSTEMS OPERATIONAL")
        print("   • Current weather: REAL DATA")
        print("   • Historical analysis: SIMULATED (realistic patterns)")
        print("   • Ready for demonstration!")
    else:
        print("⚠️  SOME ISSUES DETECTED")
        if not real_weather:
            print("   • Current weather API not working")
        if not backend_working:
            print("   • Backend not accessible")
        if not analysis_working:
            print("   • Weather analysis not working")
    
    print()
    print("🔧 TO ENABLE REAL NASA DATA:")
    print("   1. Register at https://earthdata.nasa.gov/")
    print("   2. Get API credentials")
    print("   3. Set environment variables:")
    print("      export NASA_EARTHDATA_USERNAME=your_username")
    print("      export NASA_EARTHDATA_PASSWORD=your_password")
    print("   4. Update backend/main.py to use real NASA APIs")
    print()
    print("📖 For detailed instructions, see backend/README.md")

if __name__ == "__main__":
    main()