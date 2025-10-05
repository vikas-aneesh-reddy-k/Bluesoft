# NASA API Integration Guide
## Will It Rain On My Parade? - Real NASA Data Integration

### 🎯 **Required NASA Datasets**

#### 1. **MERRA-2** (Temperature, Wind, Air Quality)
- **Full Name**: Modern-Era Retrospective analysis for Research and Applications, Version 2
- **Provider**: NASA Global Modeling and Assimilation Office (GMAO)
- **Data**: Temperature, Wind Speed, Humidity, Air Quality
- **Resolution**: 0.5° × 0.625° (about 50km)
- **Time Range**: 1980-present, daily data

**API Endpoints:**
```
# OPeNDAP Direct Access
https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/M2T1NXSLV.5.12.4/

# Giovanni Web Service (Easier for prototyping)
https://giovanni.gsfc.nasa.gov/giovanni/daac-bin/service_manager.pl
```

#### 2. **GPM IMERG** (Precipitation)
- **Full Name**: Global Precipitation Measurement Integrated Multi-satellitE Retrievals
- **Provider**: NASA Goddard Space Flight Center
- **Data**: Precipitation rates, accumulation
- **Resolution**: 0.1° × 0.1° (about 10km)
- **Time Range**: 1997-present, daily data

**API Endpoints:**
```
# OPeNDAP Direct Access
https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.06/

# Giovanni Web Service
https://giovanni.gsfc.nasa.gov/giovanni/daac-bin/service_manager.pl
```

### 🔧 **Integration Methods (Choose One)**

#### **Option A: Giovanni Web Service (Recommended for Hackathons)**
- ✅ **Easiest to implement**
- ✅ **No complex authentication**
- ✅ **Returns processed data**
- ❌ **Limited customization**

#### **Option B: OPeNDAP Direct Access (Production)**
- ✅ **Full control over data**
- ✅ **Real-time access**
- ❌ **Complex authentication**
- ❌ **Requires NetCDF handling**

#### **Option C: Earthdata Search API (Hybrid)**
- ✅ **Good balance of control and ease**
- ✅ **RESTful API**
- ❌ **Still requires authentication**

### 🛠️ **Implementation Examples**

#### **Method 1: Giovanni Web Service (Quick Start)**

```python
import requests
import pandas as pd
from datetime import datetime, timedelta

class NASAGiovanniAPI:
    def __init__(self):
        self.base_url = "https://giovanni.gsfc.nasa.gov/giovanni/daac-bin/service_manager.pl"
    
    async def get_temperature_data(self, lat: float, lon: float, start_date: str, end_date: str):
        """Get MERRA-2 temperature data via Giovanni"""
        params = {
            'service': 'TmAvMp',  # Time averaged map
            'data': 'MERRA2_400.tavg1_2d_slv_Nx:T2M',  # 2m temperature
            'bbox': f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}",
            'starttime': start_date,
            'endtime': end_date,
            'format': 'json'
        }
        
        response = requests.get(self.base_url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Giovanni API error: {response.status_code}")
    
    async def get_precipitation_data(self, lat: float, lon: float, start_date: str, end_date: str):
        """Get GPM IMERG precipitation data via Giovanni"""
        params = {
            'service': 'TmAvMp',
            'data': 'GPM_3IMERGDF_06:precipitationCal',
            'bbox': f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}",
            'starttime': start_date,
            'endtime': end_date,
            'format': 'json'
        }
        
        response = requests.get(self.base_url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Giovanni API error: {response.status_code}")
```

#### **Method 2: OPeNDAP Direct Access (Advanced)**

```python
import xarray as xr
import requests
from requests.auth import HTTPBasicAuth

class NASAOPeNDAPAPI:
    def __init__(self, username: str, password: str):
        self.auth = HTTPBasicAuth(username, password)
        self.session = requests.Session()
        self.session.auth = self.auth
    
    async def get_merra2_temperature(self, lat: float, lon: float, date: str):
        """Get MERRA-2 temperature data via OPeNDAP"""
        # Format: YYYY/MM/MERRA2_400.tavg1_2d_slv_Nx.YYYYMMDD.nc4
        year = date[:4]
        month = date[5:7]
        
        url = f"https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/M2T1NXSLV.5.12.4/{year}/{month}/MERRA2_400.tavg1_2d_slv_Nx.{date.replace('-', '')}.nc4"
        
        try:
            # Open dataset with authentication
            ds = xr.open_dataset(url, auth=self.auth)
            
            # Extract temperature at specific location
            temp_data = ds['T2M'].sel(lat=lat, lon=lon, method='nearest')
            
            return {
                'temperature': float(temp_data.values),
                'latitude': float(temp_data.lat.values),
                'longitude': float(temp_data.lon.values),
                'date': date,
                'source': 'NASA MERRA-2',
                'units': 'Kelvin'
            }
        except Exception as e:
            raise Exception(f"MERRA-2 API error: {str(e)}")
    
    async def get_gpm_precipitation(self, lat: float, lon: float, date: str):
        """Get GPM IMERG precipitation data via OPeNDAP"""
        year = date[:4]
        month = date[5:7]
        day = date[8:10]
        
        url = f"https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.06/{year}/{month}/3B-DAY.MS.MRG.3IMERG.{date.replace('-', '')}-S000000-E235959.V06.nc4"
        
        try:
            ds = xr.open_dataset(url, auth=self.auth)
            precip_data = ds['precipitationCal'].sel(lat=lat, lon=lon, method='nearest')
            
            return {
                'precipitation': float(precip_data.values),
                'latitude': float(precip_data.lat.values),
                'longitude': float(precip_data.lon.values),
                'date': date,
                'source': 'NASA GPM IMERG',
                'units': 'mm/day'
            }
        except Exception as e:
            raise Exception(f"GPM IMERG API error: {str(e)}")
```

#### **Method 3: Earthdata Search API (Balanced)**

```python
import requests
from requests.auth import HTTPBasicAuth

class EarthdataSearchAPI:
    def __init__(self, username: str, password: str):
        self.auth = HTTPBasicAuth(username, password)
        self.base_url = "https://cmr.earthdata.nasa.gov/search"
    
    async def search_merra2_data(self, lat: float, lon: float, date: str):
        """Search for MERRA-2 data files"""
        params = {
            'collection_concept_id': 'C1276812863-GES_DISC',  # MERRA-2 collection
            'temporal': f"{date}T00:00:00Z,{date}T23:59:59Z",
            'bounding_box': f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}",
            'page_size': 10,
            'format': 'json'
        }
        
        response = requests.get(f"{self.base_url}/granules", params=params, auth=self.auth)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Earthdata Search error: {response.status_code}")
```

### 🔐 **Authentication Setup**

#### **Environment Variables**
```bash
# Add to your .env file
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password

# For production, use OAuth2 tokens
NASA_EARTHDATA_TOKEN=your_oauth_token
```

#### **Backend Configuration**
```python
# In backend/main.py
import os
from dotenv import load_dotenv

load_dotenv()

class NASADataProvider:
    def __init__(self):
        self.username = os.getenv('NASA_EARTHDATA_USERNAME')
        self.password = os.getenv('NASA_EARTHDATA_PASSWORD')
        
        if not self.username or not self.password:
            print("⚠️  NASA credentials not found. Using simulated data.")
            self.use_real_data = False
        else:
            print("✅ NASA credentials found. Using real data.")
            self.use_real_data = True
            self.giovanni_api = NASAGiovanniAPI()
            self.opendap_api = NASAOPeNDAPAPI(self.username, self.password)
```

### 📦 **Required Python Packages**

```bash
# Install NASA data handling packages
pip install xarray netCDF4 requests-oauthlib

# For advanced data processing
pip install dask[complete] zarr h5py

# Update requirements.txt
echo "xarray==2023.11.0" >> backend/requirements.txt
echo "netCDF4==1.6.5" >> backend/requirements.txt
echo "requests-oauthlib==1.3.1" >> backend/requirements.txt
```

### 🚀 **Quick Start Implementation**

Replace the simulated data functions in `backend/main.py`:

```python
# Replace this simulated function:
async def get_historical_data(self, lat: float, lon: float, variable: str):
    # Simulate NASA data structure
    
# With this real NASA function:
async def get_historical_data(self, lat: float, lon: float, variable: str):
    if not self.use_real_data:
        return self._simulate_data(lat, lon, variable)  # Fallback
    
    try:
        if variable == "temperature":
            return await self.giovanni_api.get_temperature_data(
                lat, lon, "1990-01-01", "2024-12-31"
            )
        elif variable == "precipitation":
            return await self.giovanni_api.get_precipitation_data(
                lat, lon, "1990-01-01", "2024-12-31"
            )
        else:
            return self._simulate_data(lat, lon, variable)  # Fallback for other variables
    except Exception as e:
        print(f"NASA API failed: {e}. Using simulated data.")
        return self._simulate_data(lat, lon, variable)
```

### 🎯 **Testing Your NASA Integration**

1. **Test Authentication:**
```bash
python -c "
import requests
from requests.auth import HTTPBasicAuth
auth = HTTPBasicAuth('your_username', 'your_password')
r = requests.get('https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/', auth=auth)
print('✅ Auth works!' if r.status_code == 200 else f'❌ Auth failed: {r.status_code}')
"
```

2. **Run the verification script:**
```bash
python verify_data_sources.py
```

3. **Check the Data Source Indicator in your app** - it should show "REAL" for NASA datasets

### 📚 **Additional Resources**

- **NASA Earthdata Documentation**: https://earthdata.nasa.gov/learn
- **MERRA-2 Documentation**: https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/
- **GPM IMERG Documentation**: https://gpm.nasa.gov/data/imerg
- **Giovanni Tutorial**: https://giovanni.gsfc.nasa.gov/giovanni/doc/UsersManualworkingdocument.docx.html
- **OPeNDAP Tutorial**: https://disc.gsfc.nasa.gov/information/howto?title=How%20to%20Access%20Data%20Using%20OPeNDAP

### ⚡ **Quick Implementation Priority**

1. **Start with Giovanni API** (easiest)
2. **Get your NASA Earthdata account** 
3. **Test with one dataset** (MERRA-2 temperature)
4. **Add authentication to backend**
5. **Replace simulation functions one by one**
6. **Add error handling and fallbacks**

This will give you **real NASA data** while maintaining the demo functionality as a fallback!