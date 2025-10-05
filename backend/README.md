# Will It Rain On My Parade? - Backend API

NASA Space Apps Challenge 2025 - Weather Risk Analysis Backend

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API will be available at: http://localhost:8000
# Documentation: http://localhost:8000/docs
```

## API Endpoints

### POST /analyze
Analyze weather risk for a location and date

**Request:**
```json
{
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
```

**Response:**
```json
{
  "location": {"latitude": 40.7128, "longitude": -74.0060},
  "event_date": "2025-07-04",
  "comfort_index": 72,
  "probabilities": [
    {
      "condition": "Very Hot",
      "probability": 25.5,
      "threshold": ">32°C",
      "trend": "increasing",
      "confidence": 0.85,
      "historical_mean": 28.3,
      "trend_slope": 0.025,
      "p_value": 0.04
    }
  ],
  "alternative_dates": [
    {
      "date": "2025-06-27",
      "comfort_index": 78,
      "offset_days": -7,
      "recommendation": "Better"
    }
  ],
  "metadata": {
    "datasets_used": ["MERRA-2", "GPM IMERG"],
    "years_analyzed": "1990-2024",
    "analysis_date": "2025-01-15T10:30:00Z",
    "confidence_level": "85%",
    "data_window": "±7 days"
  }
}
```

## 🔍 DATA VERIFICATION STATUS

### ✅ REAL DATA (Currently Active)
- **Current Weather**: Real-time data from Open-Meteo API (ECMWF)
- **Location Services**: Real geocoding via OpenStreetMap Nominatim

### 🔬 SIMULATED DATA (Demo/Development)
- **Historical Analysis**: Climatologically realistic but simulated
- **Probability Calculations**: Based on NASA dataset structures
- **Trend Analysis**: Simulated climate change patterns

### 🚀 HOW TO VERIFY DATA IS REAL

1. **Check the Data Source Indicator** in the app UI
2. **Look for badges**: 🌐 Real Data vs 🔬 Simulated
3. **Current weather updates** every time you select a location
4. **CSV exports include** data source attribution

### 🛠️ ENABLING REAL NASA DATA

#### Step 1: NASA Earthdata Account
```bash
# 1. Register at https://earthdata.nasa.gov/
# 2. Create application credentials
# 3. Note your username/password
```

#### Step 2: Install NASA Data Tools
```bash
pip install xarray netCDF4 requests-oauthlib
```

#### Step 3: Replace Simulation Functions
```python
# In main.py, replace this:
async def get_historical_data(self, lat: float, lon: float, variable: str):
    # Simulate NASA data structure
    
# With this:
async def get_historical_data(self, lat: float, lon: float, variable: str):
    # Real NASA API call
    url = f"https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/..."
    ds = xr.open_dataset(url, auth=self.nasa_auth)
    return ds.sel(lat=lat, lon=lon, method='nearest')
```

#### Step 4: Environment Variables
```bash
# .env file
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
```

### 📊 CURRENT DATA SOURCES

## Data Sources (Cited in Exports)

1. **MERRA-2** (Temperature, Wind, Air Quality)
   - Global reanalysis dataset
   - Daily resolution, 1980-present
   - 0.5° × 0.625° spatial resolution

2. **GPM IMERG** (Precipitation)
   - Global precipitation measurement
   - 1997-present
   - 0.1° × 0.1° spatial resolution

3. **Open-Meteo** (ERA5 reanalysis backup)
   - Historical weather data
   - Easier API access for demonstrations

## Development

### Environment Variables
```bash
# .env file
BACKEND_URL=http://localhost:8000
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
OPENMETEO_API_KEY=optional
```

### Testing
```bash
# Run tests
pytest

# Test API endpoint
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "event_date": "2025-07-04",
    "thresholds": {"hot_temp": 32.0, "cold_temp": 0.0, "precipitation": 5.0, "wind_speed": 15.0}
  }'
```

### Deployment

**Render/Heroku:**
```bash
# Deploy backend
git push heroku main

# Set environment variables
heroku config:set BACKEND_URL=https://your-app.herokuapp.com
```

**Vercel (Frontend):**
```bash
# Set environment variable
VITE_BACKEND_URL=https://your-backend.herokuapp.com
```

## NASA Datasets Integration

### Phase 1: Giovanni Web Service (Quick)
```python
# Giovanni API for rapid prototyping
giovanni_url = "https://giovanni.gsfc.nasa.gov/giovanni/daac-bin/service_manager.pl"
params = {
    'service': 'TmAvMp',
    'data': 'MERRA2_400.tavg1_2d_slv_Nx:T2M',
    'bbox': f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}",
    'starttime': '1990-01-01',
    'endtime': '2024-12-31'
}
```

### Phase 2: OPeNDAP Direct Access (Production)
```python
# Direct MERRA-2 access
import xarray as xr
url = "https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/M2T1NXSLV.5.12.4/2024/01/MERRA2_400.tavg1_2d_slv_Nx.20240101.nc4"
ds = xr.open_dataset(url)
temp_data = ds['T2M'].sel(lat=lat, lon=lon, method='nearest')
```

### Phase 3: Pre-computed Climatology (Optimal)
```python
# Download and preprocess 35 years of data once
# Store as local NetCDF/Parquet for fast queries
climatology = xr.open_dataset('climatology_1990_2024.nc')
daily_stats = climatology.sel(lat=lat, lon=lon, dayofyear=event_day)
```

This backend provides a **NASA-compliant, hackathon-ready** foundation that can evolve into a production system with real-time NASA data integration.
