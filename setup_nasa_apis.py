#!/usr/bin/env python3
"""
NASA API Setup Script
Will It Rain On My Parade? - NASA Space Apps Challenge 2025

This script helps you set up NASA API access step by step.
"""

import os
import sys
import requests
from requests.auth import HTTPBasicAuth
import getpass

def print_header():
    print("🚀 NASA API Setup - Will It Rain On My Parade?")
    print("=" * 60)
    print("This script will help you set up real NASA data access.")
    print()

def check_existing_credentials():
    """Check if NASA credentials are already set"""
    username = os.getenv('NASA_EARTHDATA_USERNAME')
    password = os.getenv('NASA_EARTHDATA_PASSWORD')
    
    if username and password:
        print(f"✅ Found existing credentials for user: {username}")
        return username, password
    else:
        print("ℹ️  No existing NASA credentials found.")
        return None, None

def get_credentials():
    """Get NASA Earthdata credentials from user"""
    print("📝 NASA Earthdata Credentials Setup")
    print("-" * 40)
    print("If you don't have an account yet:")
    print("1. Go to: https://earthdata.nasa.gov/")
    print("2. Click 'Register' and create an account")
    print("3. Verify your email")
    print("4. Come back here with your username/password")
    print()
    
    username = input("Enter your NASA Earthdata username: ").strip()
    if not username:
        print("❌ Username is required!")
        return None, None
    
    password = getpass.getpass("Enter your NASA Earthdata password: ").strip()
    if not password:
        print("❌ Password is required!")
        return None, None
    
    return username, password

def test_credentials(username, password):
    """Test NASA API credentials"""
    print("🔍 Testing NASA API access...")
    
    # Test URLs
    test_urls = [
        ("MERRA-2 OPeNDAP", "https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/"),
        ("GPM OPeNDAP", "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/"),
        ("Giovanni", "https://giovanni.gsfc.nasa.gov/giovanni/")
    ]
    
    auth = HTTPBasicAuth(username, password)
    results = {}
    
    for name, url in test_urls:
        try:
            response = requests.get(url, auth=auth, timeout=10)
            if response.status_code == 200:
                print(f"✅ {name}: Working")
                results[name] = True
            elif response.status_code == 401:
                print(f"❌ {name}: Authentication failed")
                results[name] = False
            else:
                print(f"⚠️  {name}: Status {response.status_code}")
                results[name] = False
        except requests.exceptions.Timeout:
            print(f"⏱️  {name}: Timeout (may still work)")
            results[name] = True  # Timeout doesn't mean auth failed
        except Exception as e:
            print(f"❌ {name}: Error - {str(e)}")
            results[name] = False
    
    return results

def create_env_file(username, password):
    """Create or update .env file with NASA credentials"""
    env_content = f"""# NASA Earthdata Credentials
NASA_EARTHDATA_USERNAME={username}
NASA_EARTHDATA_PASSWORD={password}

# Backend Configuration
BACKEND_URL=http://localhost:8000
"""
    
    # Check if .env exists
    env_exists = os.path.exists('.env')
    
    if env_exists:
        # Read existing .env
        with open('.env', 'r') as f:
            existing_content = f.read()
        
        # Update NASA credentials
        lines = existing_content.split('\n')
        new_lines = []
        nasa_username_set = False
        nasa_password_set = False
        
        for line in lines:
            if line.startswith('NASA_EARTHDATA_USERNAME='):
                new_lines.append(f'NASA_EARTHDATA_USERNAME={username}')
                nasa_username_set = True
            elif line.startswith('NASA_EARTHDATA_PASSWORD='):
                new_lines.append(f'NASA_EARTHDATA_PASSWORD={password}')
                nasa_password_set = True
            else:
                new_lines.append(line)
        
        # Add NASA credentials if they weren't in the file
        if not nasa_username_set:
            new_lines.append(f'NASA_EARTHDATA_USERNAME={username}')
        if not nasa_password_set:
            new_lines.append(f'NASA_EARTHDATA_PASSWORD={password}')
        
        env_content = '\n'.join(new_lines)
    
    # Write .env file
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print(f"✅ {'Updated' if env_exists else 'Created'} .env file with NASA credentials")

def install_dependencies():
    """Install required Python packages for NASA data"""
    print("📦 Installing NASA data packages...")
    
    packages = [
        'xarray',
        'netCDF4', 
        'requests-oauthlib',
        'aiohttp',
        'python-dotenv'
    ]
    
    for package in packages:
        try:
            import subprocess
            result = subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Installed {package}")
            else:
                print(f"⚠️  Failed to install {package}: {result.stderr}")
        except Exception as e:
            print(f"❌ Error installing {package}: {e}")

def test_integration():
    """Test the NASA integration module"""
    print("🧪 Testing NASA integration...")
    
    try:
        # Test the integration module
        import subprocess
        result = subprocess.run([sys.executable, 'backend/nasa_integration.py'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ NASA integration test passed")
            print("Output:")
            print(result.stdout)
        else:
            print("⚠️  NASA integration test had issues:")
            print(result.stderr)
    except subprocess.TimeoutExpired:
        print("⏱️  NASA integration test timed out (this is normal for slow APIs)")
    except Exception as e:
        print(f"❌ Error testing integration: {e}")

def main():
    print_header()
    
    # Step 1: Check existing credentials
    existing_username, existing_password = check_existing_credentials()
    
    if existing_username and existing_password:
        use_existing = input("Use existing credentials? (y/n): ").lower().strip()
        if use_existing == 'y':
            username, password = existing_username, existing_password
        else:
            username, password = get_credentials()
    else:
        username, password = get_credentials()
    
    if not username or not password:
        print("❌ Setup cancelled. NASA credentials are required.")
        return
    
    # Step 2: Test credentials
    print()
    test_results = test_credentials(username, password)
    
    if not any(test_results.values()):
        print("❌ All API tests failed. Please check your credentials.")
        retry = input("Try different credentials? (y/n): ").lower().strip()
        if retry == 'y':
            username, password = get_credentials()
            if username and password:
                test_results = test_credentials(username, password)
        
        if not any(test_results.values()):
            print("❌ Setup failed. Please verify your NASA Earthdata account.")
            return
    
    # Step 3: Save credentials
    print()
    create_env_file(username, password)
    
    # Step 4: Install dependencies
    print()
    install_deps = input("Install required Python packages? (y/n): ").lower().strip()
    if install_deps == 'y':
        install_dependencies()
    
    # Step 5: Test integration
    print()
    test_integration()
    
    # Step 6: Final instructions
    print()
    print("🎉 NASA API Setup Complete!")
    print("=" * 40)
    print("Next steps:")
    print("1. Restart your backend server: python backend/main.py")
    print("2. The app will now use real NASA data when available")
    print("3. Check the Data Source Indicator in the UI")
    print("4. Run 'python verify_data_sources.py' to verify everything works")
    print()
    print("📚 For more details, see NASA_API_INTEGRATION_GUIDE.md")

if __name__ == "__main__":
    main()