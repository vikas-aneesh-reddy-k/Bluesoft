#!/usr/bin/env python3
"""
Test script to check if the backend can be imported and started
"""

import sys
import os

# Add backend directory to path
sys.path.append('backend')

try:
    print("🔍 Testing backend imports...")
    
    # Test basic imports
    from fastapi import FastAPI
    print("✅ FastAPI imported")
    
    from pydantic import BaseModel
    print("✅ Pydantic imported")
    
    import pandas as pd
    import numpy as np
    print("✅ Data processing libraries imported")
    
    # Test NASA integration
    try:
        from nasa_integration import NASADataIntegration
        print("✅ NASA integration imported")
    except Exception as e:
        print(f"⚠️  NASA integration import failed: {e}")
    
    # Test main backend module
    print("\n🚀 Testing main backend module...")
    import main
    print("✅ Backend main module imported successfully")
    
    # Test if the app can be created
    app = main.app
    print("✅ FastAPI app created successfully")
    
    # Test NASA data provider
    nasa_data = main.nasa_data
    print(f"✅ NASA data provider initialized (real data: {nasa_data.use_real_nasa_data})")
    
    print("\n🎉 Backend test completed successfully!")
    print("   You can now start the backend with: python backend/main.py")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("   Please install missing dependencies")
except Exception as e:
    print(f"❌ Backend test failed: {e}")
    import traceback
    print(f"   Traceback: {traceback.format_exc()}")