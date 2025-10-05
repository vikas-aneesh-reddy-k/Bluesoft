# Supabase PostgreSQL Database Integration Design

## Overview

This design document outlines the architecture and implementation approach for integrating Supabase PostgreSQL database into the "Will It Rain On My Parade?" weather prediction application. The integration will provide persistent storage, caching capabilities, and geospatial query support while maintaining backward compatibility with the existing stateless architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │ Supabase Database│
│                 │    │                 │    │                 │
│ - Supabase Client│◄──►│ - AsyncPG Pool  │◄──►│ - PostgreSQL    │
│ - Real-time UI  │    │ - Cache Layer   │    │ - PostGIS       │
│ - User Auth     │    │ - API Endpoints │    │ - Row Level Sec │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ External APIs   │    │ NASA APIs       │    │ Cached Data     │
│ - Open-Meteo    │    │ - MERRA-2       │    │ - Weather Cache │
│ - Geocoding     │    │ - GPM IMERG     │    │ - Historical    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                     │
├─────────────────────────────────────────────────────────────┤
│                     PostGIS Extension                      │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ user_events │ │weather_cache│ │historical_  │          │
│  │             │ │             │ │weather_data │          │
│  │ - id        │ │ - id        │ │ - id        │          │
│  │ - user_id   │ │ - location_ │ │ - location  │          │
│  │ - event_name│ │   hash      │ │ - date      │          │
│  │ - location  │ │ - analysis_ │ │ - temp_data │          │
│  │ - event_date│ │   data      │ │ - precip_   │          │
│  │ - analysis_ │ │ - expires_at│ │   data      │          │
│  │   results   │ │ - created_at│ │ - wind_data │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Indexes:                                                   │
│  - Spatial indexes on location columns                     │
│  - Temporal indexes on date columns                        │
│  - Hash indexes on cache keys                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Connection Layer

**Purpose**: Manage database connections and provide connection pooling

```python
# backend/database/connection.py
class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    async def initialize(self):
        """Initialize connection pool"""
        
    async def get_connection(self):
        """Get database connection from pool"""
        
    async def close(self):
        """Close all connections"""
```

### 2. Data Models and Schemas

**Purpose**: Define database schemas and Pydantic models

```python
# backend/models/database.py
class UserEvent(BaseModel):
    id: Optional[int] = None
    user_id: str
    event_name: str
    event_date: date
    latitude: float
    longitude: float
    location_name: str
    analysis_results: Dict[str, Any]
    created_at: Optional[datetime] = None

class WeatherCache(BaseModel):
    id: Optional[int] = None
    location_hash: str
    analysis_data: Dict[str, Any]
    expires_at: datetime
    created_at: Optional[datetime] = None

class HistoricalWeatherData(BaseModel):
    id: Optional[int] = None
    latitude: float
    longitude: float
    date: date
    temperature: Optional[float] = None
    precipitation: Optional[float] = None
    wind_speed: Optional[float] = None
    data_source: str
```

### 3. Repository Pattern Implementation

**Purpose**: Abstract database operations and provide clean interfaces

```python
# backend/repositories/user_events.py
class UserEventsRepository:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    async def create_event(self, event: UserEvent) -> UserEvent:
        """Create new user event"""
        
    async def get_user_events(self, user_id: str) -> List[UserEvent]:
        """Get all events for a user"""
        
    async def get_event_by_id(self, event_id: int) -> Optional[UserEvent]:
        """Get specific event by ID"""
        
    async def update_event(self, event: UserEvent) -> UserEvent:
        """Update existing event"""
        
    async def delete_event(self, event_id: int) -> bool:
        """Delete event"""

# backend/repositories/weather_cache.py
class WeatherCacheRepository:
    async def get_cached_analysis(self, location_hash: str) -> Optional[Dict]:
        """Get cached weather analysis"""
        
    async def store_analysis(self, location_hash: str, data: Dict, ttl_hours: int = 6):
        """Store weather analysis in cache"""
        
    async def cleanup_expired(self):
        """Remove expired cache entries"""

# backend/repositories/historical_weather.py
class HistoricalWeatherRepository:
    async def get_historical_data(self, lat: float, lon: float, 
                                 start_date: date, end_date: date) -> List[HistoricalWeatherData]:
        """Get historical weather data for location and date range"""
        
    async def store_historical_data(self, data: List[HistoricalWeatherData]):
        """Store historical weather data"""
        
    async def get_nearby_data(self, lat: float, lon: float, 
                             radius_km: float, date: date) -> List[HistoricalWeatherData]:
        """Get weather data within radius using PostGIS"""
```

### 4. Service Layer Integration

**Purpose**: Integrate database operations with existing business logic

```python
# backend/services/weather_service.py
class WeatherService:
    def __init__(self, cache_repo: WeatherCacheRepository, 
                 historical_repo: HistoricalWeatherRepository):
        self.cache = cache_repo
        self.historical = historical_repo
        self.nasa_data = NASADataProvider()
    
    async def analyze_weather_risk_cached(self, request: LocationRequest) -> WeatherAnalysisResponse:
        """Analyze weather risk with caching"""
        # 1. Check cache first
        # 2. If cache miss, fetch from APIs
        # 3. Store in cache
        # 4. Return results
        
    async def get_historical_data_cached(self, lat: float, lon: float, variable: str) -> pd.DataFrame:
        """Get historical data with local storage"""
        # 1. Check local database
        # 2. If not found, fetch from NASA APIs
        # 3. Store locally
        # 4. Return data
```

### 5. Frontend Integration

**Purpose**: Connect React frontend to Supabase for real-time features

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// src/hooks/useUserEvents.ts
export function useUserEvents(userId: string) {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Fetch user events
    // Set up real-time subscription
  }, [userId])
  
  return { events, loading, createEvent, updateEvent, deleteEvent }
}
```

## Data Models

### Database Schema

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- User events table
CREATE TABLE user_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location_name TEXT,
    analysis_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather analysis cache table
CREATE TABLE weather_analysis_cache (
    id SERIAL PRIMARY KEY,
    location_hash VARCHAR(64) UNIQUE NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    event_date DATE NOT NULL,
    analysis_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical weather data table
CREATE TABLE historical_weather_data (
    id SERIAL PRIMARY KEY,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    date DATE NOT NULL,
    temperature DECIMAL(5,2),
    precipitation DECIMAL(6,2),
    wind_speed DECIMAL(5,2),
    humidity INTEGER,
    pressure DECIMAL(7,2),
    data_source VARCHAR(50) NOT NULL,
    variable_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(latitude, longitude, date, variable_type, data_source)
);

-- Create indexes for performance
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_location ON user_events USING GIST(location);
CREATE INDEX idx_user_events_date ON user_events(event_date);

CREATE INDEX idx_weather_cache_hash ON weather_analysis_cache(location_hash);
CREATE INDEX idx_weather_cache_expires ON weather_analysis_cache(expires_at);

CREATE INDEX idx_historical_location ON historical_weather_data USING GIST(location);
CREATE INDEX idx_historical_date ON historical_weather_data(date);
CREATE INDEX idx_historical_coords_date ON historical_weather_data(latitude, longitude, date);

-- Row Level Security (RLS)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own events
CREATE POLICY "Users can view own events" ON user_events
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own events" ON user_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own events" ON user_events
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own events" ON user_events
    FOR DELETE USING (auth.uid()::text = user_id);
```

## Error Handling

### Graceful Degradation Strategy

```python
class DatabaseService:
    async def with_fallback(self, db_operation, fallback_operation):
        """Execute database operation with fallback"""
        try:
            return await db_operation()
        except Exception as e:
            logger.warning(f"Database operation failed: {e}")
            logger.info("Falling back to stateless operation")
            return await fallback_operation()

# Usage example
async def analyze_weather_risk(request: LocationRequest):
    return await db_service.with_fallback(
        lambda: analyze_weather_risk_cached(request),
        lambda: analyze_weather_risk_stateless(request)
    )
```

### Error Types and Handling

1. **Connection Errors**: Retry with exponential backoff, fallback to stateless
2. **Query Errors**: Log error, return cached data if available
3. **Cache Misses**: Fetch from external APIs, continue normally
4. **Migration Errors**: Rollback changes, maintain data integrity

## Testing Strategy

### Unit Tests
- Repository pattern methods
- Database connection management
- Cache operations
- Data model validation

### Integration Tests
- End-to-end API workflows with database
- Cache hit/miss scenarios
- Geospatial query accuracy
- Fallback behavior testing

### Performance Tests
- Query performance under load
- Cache effectiveness metrics
- Spatial index performance
- Connection pool behavior

### Database Tests
```python
# tests/test_repositories.py
@pytest.mark.asyncio
async def test_user_events_repository():
    # Test CRUD operations
    # Test geospatial queries
    # Test cache operations

@pytest.mark.asyncio
async def test_weather_cache_expiration():
    # Test cache TTL
    # Test cleanup operations

@pytest.mark.asyncio
async def test_fallback_behavior():
    # Test database unavailable scenarios
    # Test graceful degradation
```

## Deployment and Configuration

### Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Cache Configuration
CACHE_TTL_HOURS=6
CACHE_CLEANUP_INTERVAL_HOURS=24
```

### Migration Management
```python
# backend/migrations/001_initial_schema.py
async def upgrade():
    """Apply initial schema"""
    
async def downgrade():
    """Rollback initial schema"""

# backend/migrations/manager.py
class MigrationManager:
    async def run_migrations():
        """Run pending migrations"""
        
    async def rollback_migration(version: str):
        """Rollback specific migration"""
```

This design provides a robust, scalable database integration that enhances your weather prediction app while maintaining reliability and performance.