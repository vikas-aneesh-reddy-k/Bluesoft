"""
Simple backend server for weather analysis
Minimal dependencies version
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import random
import json
from datetime import datetime, timedelta

app = FastAPI(
    title="Will It Rain On My Parade? - Simple Backend",
    description="Simple weather risk analysis API",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    event_date: str
    thresholds: Dict[str, float]
    is_current_date: Optional[bool] = False

class WeatherProbability(BaseModel):
    condition: str
    probability: float
    threshold: str
    trend: str
    confidence: float
    historical_mean: float
    trend_slope: float
    p_value: float

class AlternativeDate(BaseModel):
    date: str
    comfort_index: int
    offset_days: int
    recommendation: str

class WeatherAnalysisResponse(BaseModel):
    location: Dict[str, float]
    event_date: str
    comfort_index: int
    probabilities: List[WeatherProbability]
    alternative_dates: List[AlternativeDate]
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "Will It Rain On My Parade? - Simple Backend API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/analyze", response_model=WeatherAnalysisResponse)
async def analyze_weather_risk(request: LocationRequest):
    """
    Analyze weather risk for a given location and date
    Returns simulated data when NASA data is not available
    """
    try:
        # Simulate weather analysis based on location and date
        lat, lng = request.latitude, request.longitude
        event_date = datetime.fromisoformat(request.event_date)
        
        # Generate realistic probabilities based on location and season
        base_temp_prob = 20 + abs(lat) * 0.5  # Higher probability near poles
        base_precip_prob = 30 + (90 - abs(lat)) * 0.3  # Higher probability near equator
        
        # Seasonal adjustments
        day_of_year = event_date.timetuple().tm_yday
        seasonal_factor = 0.5 + 0.5 * abs(1 - abs(day_of_year - 182) / 182)
        
        probabilities = [
            WeatherProbability(
                condition="Temperature",
                probability=round(base_temp_prob * seasonal_factor + random.uniform(-10, 10), 1),
                threshold=f">{request.thresholds.get('hot_temp', 32)}°C",
                trend=random.choice(['increasing', 'decreasing', 'stable']),
                confidence=round(random.uniform(0.6, 0.9), 2),
                historical_mean=round(25 + abs(lat) * 0.3, 1),
                trend_slope=round(random.uniform(-0.5, 0.5), 2),
                p_value=round(random.uniform(0.01, 0.1), 3)
            ),
            WeatherProbability(
                condition="Precipitation",
                probability=round(base_precip_prob * seasonal_factor + random.uniform(-15, 15), 1),
                threshold=f">{request.thresholds.get('precipitation', 5)}mm",
                trend=random.choice(['increasing', 'decreasing', 'stable']),
                confidence=round(random.uniform(0.5, 0.8), 2),
                historical_mean=round(5 + (90 - abs(lat)) * 0.2, 1),
                trend_slope=round(random.uniform(-0.3, 0.3), 2),
                p_value=round(random.uniform(0.01, 0.1), 3)
            ),
            WeatherProbability(
                condition="Wind Speed",
                probability=round(15 + abs(lat) * 0.2 + random.uniform(-10, 10), 1),
                threshold=f">{request.thresholds.get('wind_speed', 15)}m/s",
                trend=random.choice(['increasing', 'decreasing', 'stable']),
                confidence=round(random.uniform(0.7, 0.9), 2),
                historical_mean=round(8 + abs(lat) * 0.1, 1),
                trend_slope=round(random.uniform(-0.2, 0.2), 2),
                p_value=round(random.uniform(0.01, 0.1), 3)
            )
        ]
        
        # Generate alternative dates
        alternative_dates = []
        for i in range(1, 4):
            alt_date = event_date + timedelta(days=i)
            comfort_index = round(60 + random.uniform(-20, 30), 0)
            recommendation = "Better" if comfort_index > 75 else "Monitor" if comfort_index > 60 else "Risky"
            
            alternative_dates.append(AlternativeDate(
                date=alt_date.strftime("%Y-%m-%d"),
                comfort_index=int(comfort_index),
                offset_days=i,
                recommendation=recommendation
            ))
        
        # Calculate overall comfort index
        avg_probability = sum(p.probability for p in probabilities) / len(probabilities)
        comfort_index = max(0, min(100, round(100 - avg_probability)))
        
        return WeatherAnalysisResponse(
            location={"latitude": lat, "longitude": lng},
            event_date=request.event_date,
            comfort_index=comfort_index,
            probabilities=probabilities,
            alternative_dates=alternative_dates,
            metadata={
                "datasets_used": ["Simulated weather data"],
                "years_analyzed": "2020-2024",
                "analysis_date": datetime.now().strftime("%Y-%m-%d"),
                "confidence_level": "Medium",
                "data_window": "Simulated analysis",
                "note": "Using simulated data - NASA integration not available"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting simple backend server...")
    print("Available endpoints:")
    print("  GET  / - Root endpoint")
    print("  GET  /health - Health check")
    print("  POST /analyze - Weather analysis")
    print("\nServer will start on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
