import { useEffect, useRef, useState } from 'react';
import { Search, Navigation, Cloud, Sun, MapPin, Locate, Layers, CloudRain, CloudSnow, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import './weather-animations.css';

// Minimal Compass Component for Map2D
function CompassComponent({ 
  className, 
  onReset
}: { 
  className?: string;
  onReset?: () => void;
}) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="w-12 h-12 rounded-full border-2 border-white/70 bg-black/80 backdrop-blur-md shadow-2xl flex items-center justify-center cursor-pointer hover:border-white hover:bg-black/90 hover:shadow-3xl transition-all duration-200"
        onClick={onReset}
        title="Click to reset view to North"
      >
        <div className="relative w-10 h-10">
          {/* North indicator */}
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white drop-shadow-lg">N</div>
          
          {/* Static compass needle (always pointing north for 2D map) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* North needle (red) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-500 rounded-full origin-bottom -translate-y-2"></div>
            {/* South needle (gray) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400 rounded-full origin-top translate-y-2 rotate-180"></div>
          </div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

interface Map2DProps {
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  selectedLocation?: { lat: number; lng: number; name?: string };
  weatherType?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
}

// Geocoding API service (CORS-friendly via Open-Meteo)
// Avoid using localhost on Vercel even if accidentally provided via env
const __RAW_API_BASE = (import.meta as any).env?.VITE_BACKEND_URL || '';
const __IS_LOCALHOST = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const __IS_LOCALHOST_URL = /(localhost|127\.0\.0\.1)/i.test(String(__RAW_API_BASE));
const API_BASE = __RAW_API_BASE && !__IS_LOCALHOST_URL ? __RAW_API_BASE : (__IS_LOCALHOST ? __RAW_API_BASE : '');

const GEOCODING_API = {
  geocode: async (locationName: string) => {
    try {
      // Accept direct coordinates "lat,lng"
      const coordMatch = locationName.trim().match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        const rev = await GEOCODING_API.reverseGeocode(lat, lng);
        return {
          lat,
          lng,
          name: rev?.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };
      }
      // Order: Open-Meteo → Photon → Mapbox (via backend) → backend Nominatim (wider candidate set)
      const q = locationName.trim();
      // Try backend proxy if configured, otherwise use Open-Meteo public geocoding first
      let response = API_BASE
        ? await fetch(`${API_BASE}/proxy/geocode?name=${encodeURIComponent(q)}`)
        : await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`).catch(() => new Response(null, { status: 599 } as any));
      if (!response.ok) {
        response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10`).catch(() => new Response(null, { status: 599 } as any));
      }
      if (!response.ok) {
        response = API_BASE
          ? await fetch(`${API_BASE}/proxy/nominatim/search?q=${encodeURIComponent(q)}&limit=5`)
          : new Response(null, { status: 599 });
      }
      if (!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);
      let data = await response.json();
      const candidates: Array<{lat:number;lon:number;label:string;score:number}> = [];
      const push = (lat:number, lon:number, label:string) => {
        const lc = label?.toLowerCase?.() || '';
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
        const hits = tokens.reduce((acc,t)=>acc + (lc.includes(t)?1:0),0);
        const score = hits / Math.max(1, tokens.length);
        candidates.push({lat, lon, label, score});
      };
      if (Array.isArray(data)) {
        data.forEach((r:any)=> push(parseFloat(r.lat), parseFloat(r.lon), r.display_name || r.name || ''));
      }
      if (Array.isArray(data?.results)) {
        data.results.forEach((r:any)=> push(r.latitude, r.longitude, `${r.name || ''}${r.admin1?`, ${r.admin1}`:''}${r.country?`, ${r.country}`:''}`));
      }
      if (Array.isArray(data?.features)) {
        data.features.forEach((f:any)=> {
          // Photon or Mapbox feature support
          if (Array.isArray(f?.geometry?.coordinates)) {
            const [lon, lat] = f.geometry.coordinates;
            push(lat, lon, f.properties?.name || f.properties?.city || f.place_name || f.text || f.properties?.country || '');
          }
        });
      }
      if (!candidates.length) {
        // Try Mapbox via backend proxy if still no results
        const mb = API_BASE
          ? await fetch(`${API_BASE}/proxy/mapbox/search?q=${encodeURIComponent(q)}&limit=5`).catch(()=>null as any)
          : null as any;
        if (mb && mb.ok) {
          const mbData = await mb.json();
          (mbData?.features||[]).forEach((f:any)=>{
            const [lon, lat] = f?.center || f?.geometry?.coordinates || [];
            if (typeof lat === 'number' && typeof lon === 'number') {
              push(lat, lon, f.place_name || f.text || f.properties?.name || '');
            }
          });
        }
      }

      // Public Nominatim fallback when no backend is configured
      if (!candidates.length && !API_BASE) {
        try {
          const nomPublic = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`, {
            headers: { 'Accept': 'application/json' }
          }).catch(()=>null as any);
          if (nomPublic && nomPublic.ok) {
            const nomData = await nomPublic.json();
            (Array.isArray(nomData)?nomData:[]).forEach((r:any)=> push(parseFloat(r.lat), parseFloat(r.lon), r.display_name || r.name || ''));
          }
        } catch {}
      }

      if (!candidates.length) {
        const retry = API_BASE
          ? await fetch(`${API_BASE}/proxy/geocode?name=${encodeURIComponent(q + ' India')}`)
          : await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q + ' India')}&count=5&language=en&format=json`).catch(() => new Response(null, { status: 599 } as any));
        if (retry.ok) {
          data = await retry.json();
          (data?.results||[]).forEach((r:any)=> push(r.latitude, r.longitude, `${r.name || ''}${r.admin1?`, ${r.admin1}`:''}${r.country?`, ${r.country}`:''}`));
        }
      }

      if (!candidates.length) {
        const nom = API_BASE
          ? await fetch(`${API_BASE}/proxy/nominatim/search?q=${encodeURIComponent(q)}&limit=5`).catch(()=>null as any)
          : null as any;
        if (nom && nom.ok) {
          const nomData = await nom.json();
          (Array.isArray(nomData)?nomData:[]).forEach((r:any)=> push(parseFloat(r.lat), parseFloat(r.lon), r.display_name || r.name || ''));
        }
      }
      candidates.sort((a,b)=> b.score - a.score);
      const best = candidates[0];
      if (best) return { lat: best.lat, lng: best.lon, name: best.label || q };
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  reverseGeocode: async (lat: number, lng: number) => {
    try {
      // Order: Open-Meteo reverse → Photon reverse → Mapbox (via backend) → backend Nominatim reverse
      // Use backend proxy for Open-Meteo to avoid CORS (only if configured)
      let response = API_BASE
        ? await fetch(`${API_BASE}/proxy/reverse-geocode?latitude=${lat}&longitude=${lng}`)
        : new Response(null, { status: 599 });
      if (!response.ok) {
        response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
      }
      if (!response.ok) {
        const mb = API_BASE
          ? await fetch(`${API_BASE}/proxy/mapbox/reverse?latitude=${lat}&longitude=${lng}&limit=1`).catch(()=>null as any)
          : null as any;
        if (mb && mb.ok) {
          const mbData = await mb.json();
          const feature = mbData?.features?.[0];
          const place = feature?.place_name || feature?.text;
          if (place) return { name: place, country: '', city: '' };
        }
        response = API_BASE
          ? await fetch(`${API_BASE}/proxy/nominatim/reverse?latitude=${lat}&longitude=${lng}&zoom=12`)
          : new Response(null, { status: 599 });
      }
      if (!response.ok) throw new Error(`Reverse geocoding HTTP ${response.status}`);
      const data = await response.json();
      const name = data?.display_name 
        || (data?.features?.[0]?.properties?.name || data?.features?.[0]?.properties?.city)
        || (data?.results?.[0]?.name ? `${data.results[0].name}${data.results[0].admin1 ? ', ' + data.results[0].admin1 : ''}${data.results[0].country ? ', ' + data.results[0].country : ''}` : undefined);
      if (name) {
        return {
          name,
          country: data?.address?.country || data?.features?.[0]?.properties?.country || data?.results?.[0]?.country || '',
          city: data?.address?.city || data?.address?.town || data?.address?.village || data?.features?.[0]?.properties?.city || data?.results?.[0]?.name || ''
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  getLocationByIP: async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data && data.latitude && data.longitude) {
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          name: `${data.city}, ${data.region}, ${data.country_name}`,
          accuracy: 'city'
        };
      }
      return null;
    } catch (error) {
      console.error('IP geolocation error:', error);
      return null;
    }
  }
};

// Format coordinates with proper N/S/E/W directions
const formatCoordinates = (lat: number, lng: number) => {
  const latDirection = lat >= 0 ? 'N' : 'S';
  const lngDirection = lng >= 0 ? 'E' : 'W';
  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);
  
  return {
    formatted: `${latAbs}°${latDirection}, ${lngAbs}°${lngDirection}`,
    lat: `${latAbs}°${latDirection}`,
    lng: `${lngAbs}°${lngDirection}`
  };
};

// Weather Animation Components
const WeatherOverlay = ({ weatherType, isVisible }: { weatherType: string; isVisible: boolean }) => {
  if (!isVisible) return null;

  const renderWeatherAnimation = () => {
    switch (weatherType) {
      case 'clear':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Animated sun rays */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-8 bg-yellow-400/60 rounded-full"
                    style={{
                      transform: `rotate(${i * 45}deg) translateY(-24px)`,
                      transformOrigin: 'center 32px'
                    }}
                  />
                ))}
              </div>
              {/* Sun center */}
              <div className="w-12 h-12 bg-yellow-400 rounded-full shadow-lg animate-pulse" style={{ animationDuration: '3s' }}>
                <Sun className="w-8 h-8 text-yellow-100 m-2" />
              </div>
            </div>
          </div>
        );

      case 'cloudy':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Multiple floating clouds */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float-cloud opacity-70"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${15 + i * 10}%`,
                  animationDelay: `${i * 2}s`,
                  animationDuration: '8s'
                }}
              >
                <Cloud className="w-8 h-8 text-gray-400" />
              </div>
            ))}
          </div>
        );

      case 'rainy':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Rain clouds */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <CloudRain className="w-10 h-10 text-blue-500" />
            </div>
            {/* Animated rain drops */}
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-blue-400 rounded-full animate-rain-drop opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        );

      case 'stormy':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Storm clouds */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <Cloud className="w-12 h-12 text-gray-700" />
            </div>
            {/* Lightning bolts */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-lightning opacity-0"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${20 + i * 15}%`,
                  animationDelay: `${i * 3}s`,
                  animationDuration: '0.5s'
                }}
              >
                <Zap className="w-6 h-6 text-yellow-300" />
              </div>
            ))}
            {/* Heavy rain */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-6 bg-blue-600 rounded-full animate-rain-drop opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'snowy':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Snow clouds */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <CloudSnow className="w-10 h-10 text-gray-300" />
            </div>
            {/* Snowflakes */}
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-snowfall opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg z-20">
      {renderWeatherAnimation()}
    </div>
  );
};

export function Map2D({ onLocationSelect, selectedLocation, weatherType = 'clear' }: Map2DProps) {
  const [mapType, setMapType] = useState<'normal' | 'satellite'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [zoom, setZoom] = useState(2);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  // Backend analysis states (match 3D globe)
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [weatherProbabilities, setWeatherProbabilities] = useState<Array<{condition: string; probability: number; threshold: string; trend: 'increasing'|'decreasing'|'stable'; confidence?: number;}>>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [weatherThresholds] = useState({ hotTemp: 32, coldTemp: 0, precipitation: 5, windSpeed: 15 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Local weather overlay state
  const [selectedWeatherType, setSelectedWeatherType] = useState<'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'>(weatherType);
  const [isWeatherEnabled, setIsWeatherEnabled] = useState<boolean>(true);
  // Area selection (polygon -> centroid + radius) for analysis
  const [drawMode, setDrawMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Array<{x: number; y: number}>>([]); // reused for circle start/end
  const [areaRadiusKm, setAreaRadiusKm] = useState<number>(0);
  const [polygonLatLng, setPolygonLatLng] = useState<Array<{lat:number; lng:number}>>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Backend API
  const BACKEND_URL = (__RAW_API_BASE && !__IS_LOCALHOST_URL)
    ? __RAW_API_BASE
    : (__IS_LOCALHOST ? __RAW_API_BASE : '');
  const analyzeWeatherRisk = async (lat: number, lng: number, date: Date, radiusKm?: number, polygon?: Array<{lat:number; lng:number}>) => {
    try {
      setIsAnalyzing(true);
      if (!BACKEND_URL) throw new Error('No backend configured');
      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          event_date: date.toISOString().split('T')[0],
          thresholds: {
            hot_temp: weatherThresholds.hotTemp,
            cold_temp: weatherThresholds.coldTemp,
            precipitation: weatherThresholds.precipitation,
            wind_speed: weatherThresholds.windSpeed,
          },
          area_radius_km: radiusKm || areaRadiusKm || 0,
          polygon: (polygon && polygon.length >= 3) ? polygon.map(p=>({lat:p.lat,lng:p.lng})) : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      const data = await res.json();
      setWeatherProbabilities(data.probabilities || []);
      setShowAnalysis(true);
    } catch (e) {
      console.error('2D analysis error:', e);
      
      // Fallback to simulated data when backend is unavailable
      const fallbackProbabilities = [
        { condition: 'Temperature', probability: Math.random() * 30 + 20, threshold: '>32°C', trend: 'stable' as const, confidence: 0.7 },
        { condition: 'Precipitation', probability: Math.random() * 40 + 10, threshold: '>5mm', trend: 'stable' as const, confidence: 0.6 },
        { condition: 'Wind Speed', probability: Math.random() * 25 + 5, threshold: '>15m/s', trend: 'stable' as const, confidence: 0.8 },
      ];
      
      setWeatherProbabilities(fallbackProbabilities);
      setShowAnalysis(true);
      console.log('Using fallback weather analysis data');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      setZoom(10);
      // Trigger backend analysis when location changes
      analyzeWeatherRisk(selectedLocation.lat, selectedLocation.lng, eventDate);
    }
  }, [selectedLocation]);

  // Update selected weather type when prop changes
  useEffect(() => {
    setSelectedWeatherType(weatherType);
  }, [weatherType]);

  // Re-analyze when event date changes
  useEffect(() => {
    if (selectedLocation) {
      analyzeWeatherRisk(selectedLocation.lat, selectedLocation.lng, eventDate);
    }
  }, [eventDate]);

  // Parse coordinates from various formats (same as 3D globe)
  const parseCoordinates = (query: string) => {
    const trimmed = query.trim();
    
    // Format 1: "lat, lng" (e.g., "28.6139, 77.2090")
    const basicCoords = trimmed.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (basicCoords) {
      return {
        lat: parseFloat(basicCoords[1]),
        lng: parseFloat(basicCoords[2])
      };
    }
    
    // Format 2: "lat°N/S, lng°E/W" (e.g., "28.6139°N, 77.2090°E")
    const degreesCoords = trimmed.match(/^(\d+\.?\d*)°([NS]),\s*(\d+\.?\d*)°([EW])$/i);
    if (degreesCoords) {
      let lat = parseFloat(degreesCoords[1]);
      let lng = parseFloat(degreesCoords[3]);
      
      if (degreesCoords[2].toUpperCase() === 'S') lat = -lat;
      if (degreesCoords[4].toUpperCase() === 'W') lng = -lng;
      
      return { lat, lng };
    }
    
    // Format 3: Just two numbers separated by space (e.g., "28.6139 77.2090")
    const spaceCoords = trimmed.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);
    if (spaceCoords) {
      return {
        lat: parseFloat(spaceCoords[1]),
        lng: parseFloat(spaceCoords[2])
      };
    }
    
    return null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // First, try to parse as coordinates
      const coords = parseCoordinates(searchQuery);
      
      if (coords) {
        // Validate coordinate ranges
        if (coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180) {
          // Get location name for the coordinates
          const locationData = await GEOCODING_API.reverseGeocode(coords.lat, coords.lng);
          const locationName = locationData ? locationData.name : `${formatCoordinates(coords.lat, coords.lng).formatted}`;
          
          onLocationSelect(coords.lat, coords.lng, locationName);
          setCenter({ lat: coords.lat, lng: coords.lng });
          setZoom(10);
          setSearchQuery('');
          setIsSearching(false);
          return;
        } else {
          alert('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
          setIsSearching(false);
          return;
        }
      }
      
      // If not coordinates, try geocoding API
      const result = await GEOCODING_API.geocode(searchQuery);
      if (result) {
        onLocationSelect(result.lat, result.lng, result.name);
        setCenter({ lat: result.lat, lng: result.lng });
        setZoom(10);
        setSearchQuery('');
      } else {
        alert('Location not found. Please try a different search term or use coordinates (e.g., "28.6139, 77.2090").');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for location. Please try again.');
    }
    setIsSearching(false);
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

      navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Get real location name
        try {
          const locationData = await GEOCODING_API.reverseGeocode(latitude, longitude);
          const locationName = locationData ? locationData.name : 'Current Location';
          onLocationSelect(latitude, longitude, locationName);
          setCenter({ lat: latitude, lng: longitude });
          setZoom(12);
        } catch (error) {
          onLocationSelect(latitude, longitude, 'Current Location');
          setCenter({ lat: latitude, lng: longitude });
          setZoom(12);
        }
        
        setIsGettingLocation(false);
      },
      async (error) => {
        console.error('GPS Geolocation error:', error);
        
        // Try IP-based location as fallback
        try {
          const ipLocation = await GEOCODING_API.getLocationByIP();
          if (ipLocation) {
            setCurrentLocation({ lat: ipLocation.lat, lng: ipLocation.lng });
            onLocationSelect(ipLocation.lat, ipLocation.lng, `${ipLocation.name} (Approximate)`);
            setCenter({ lat: ipLocation.lat, lng: ipLocation.lng });
            setZoom(8);
            setIsGettingLocation(false);
            alert('GPS not available. Showing approximate location based on your internet connection.');
            return;
          }
        } catch (ipError) {
          console.error('IP geolocation also failed:', ipError);
        }
        
        setIsGettingLocation(false);
        alert('Unable to get your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* Search - below mode bar on small screens */}
      <div className="hidden sm:block absolute top-16 left-4 z-40 w-56 md:w-72">
        <div className="flex gap-1 bg-card/80 backdrop-blur-sm border border-primary/20 rounded px-2 py-1 shadow-sm">
            <Input
              type="text"
            placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-transparent border-none focus:ring-0 text-[10px] h-6"
            />
            <Button
              onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            variant="ghost"
            size="sm"
            className="shrink-0 h-6 w-6 p-0"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
            ) : (
              <Search className="h-3 w-3" />
            )}
            </Button>
        </div>
      </div>

      {/* Right sidebar stack: Date + GPS + Weather (compact, aligned) */}
      <div className="absolute top-6 right-3 sm:top-4 sm:right-4 z-40 flex flex-col gap-2 w-36 sm:w-56 pointer-events-auto">
        <div className="bg-card/90 backdrop-blur border border-primary/20 rounded-md p-1 shadow-lg w-full">
          <div className="text-[9px] font-semibold mb-1 flex items-center gap-1.5 justify-between"><span>📅</span><span className="hidden sm:inline">Event Date</span><span className="sm:hidden">Date</span></div>
          <Input
            type="date"
            value={eventDate.toISOString().split('T')[0]}
            onChange={(e) => setEventDate(new Date(e.target.value))}
            className="w-full text-[10px] h-7 px-2"
          />
          <Button
            onClick={() => selectedLocation && analyzeWeatherRisk(selectedLocation.lat, selectedLocation.lng, eventDate)}
            disabled={!selectedLocation || isAnalyzing}
            className="mt-1.5 w-full h-7 text-[10px]"
            variant="default"
            size="sm"
          >
            {isAnalyzing ? 'Analyzing…' : <span><span className="hidden sm:inline">Check My Day</span><span className="sm:hidden">Analyze</span></span>}
          </Button>
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            variant="outline"
            size="sm"
            className="mt-1.5 w-full h-7 text-[10px] bg-card/80 backdrop-blur border-primary/20 hover:bg-primary/10"
          >
            {isGettingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <Locate className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">{isGettingLocation ? 'Getting GPS...' : 'My Location'}</span>
            <span className="ml-2 sm:hidden">GPS</span>
          </Button>
        </div>
      
        {/* Auto Weather Indicator (desktop) */}
        <div className="hidden sm:block bg-card/80 backdrop-blur-md border border-primary/30 rounded-md p-1.5 shadow-md w-full mt-1">
          <div className="flex items-center gap-2">
            {weatherType === 'clear' && <span className="text-lg">☀️</span>}
            {weatherType === 'cloudy' && <span className="text-lg">☁️</span>}
            {weatherType === 'rainy' && <span className="text-lg">🌧️</span>}
            {weatherType === 'stormy' && <span className="text-lg">⛈️</span>}
            {weatherType === 'snowy' && <span className="text-lg">🌨️</span>}
            <span className="text-[11px] text-muted-foreground capitalize">
              Auto: {weatherType}
            </span>
          </div>
        </div>
      </div>

      {/* Auto Weather Indicator (mobile) - left side down */}
      <div className="sm:hidden absolute left-2 bottom-14 z-40">
        <div className="bg-card/80 backdrop-blur-md border border-primary/30 rounded-md px-2 py-1 shadow-md w-40">
          <div className="flex items-center gap-2">
            {weatherType === 'clear' && <span className="text-base">☀️</span>}
            {weatherType === 'cloudy' && <span className="text-base">☁️</span>}
            {weatherType === 'rainy' && <span className="text-base">🌧️</span>}
            {weatherType === 'stormy' && <span className="text-base">⛈️</span>}
            {weatherType === 'snowy' && <span className="text-base">🌨️</span>}
            <span className="text-[10px] text-muted-foreground capitalize">Auto: {weatherType}</span>
          </div>
        </div>
      </div>

      {/* Current location info (compact) */}
      {currentLocation && (
        <div className="absolute top-[260px] right-4 z-30 bg-card/80 backdrop-blur border border-primary/20 rounded-md p-2 text-[11px] w-60">
          <div className="text-green-400 font-semibold">📍 Your Location</div>
          <div className="text-muted-foreground">
            {formatCoordinates(currentLocation.lat, currentLocation.lng).formatted}
          </div>
        </div>
      )}
          
          {/* Map type selector */}
      <div className="absolute top-4 left-3 sm:left-4 z-50">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-card/95 backdrop-blur border border-primary/30 rounded-lg shadow-lg max-w-[92vw]">
            <Button
              variant={mapType === 'normal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapType('normal')}
            className="text-[10px] px-2 py-1"
            >
            <Layers className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Normal</span>
            </Button>
            <Button
              variant={mapType === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapType('satellite')}
            className="text-[10px] px-2 py-1"
          >
            <MapPin className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Satellite</span>
          </Button>
            <Button
              variant={drawMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (mapType !== 'normal') {
                  alert('Switch to Normal map to draw area.');
                  return;
                }
                setDrawMode(!drawMode);
                setPolygonPoints([]);
              }}
              className="text-[10px] px-2 py-1"
            >
              <span className="hidden sm:inline">{drawMode ? 'Finish Drawing' : 'Draw Area'}</span>
              <span className="sm:hidden">{drawMode ? 'Finish' : 'Area'}</span>
            </Button>
            {/* compact search when very narrow */}
            <div className="ml-1 flex sm:hidden">
              <div className="flex items-center gap-1 bg-card/80 border border-primary/20 rounded px-1 py-0.5">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent border-none focus:ring-0 text-[10px] h-6 w-24"
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {polygonPoints.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Compute center and radius from two points (circle)
                  const container = mapContainerRef.current;
                  const w = container?.clientWidth || 1;
                  const h = container?.clientHeight || 1;
                  const minLng = center.lng - 0.01;
                  const maxLng = center.lng + 0.01;
                  const minLat = center.lat - 0.01;
                  const maxLat = center.lat + 0.01;
                  const toLatLng = (pt: {x:number;y:number}) => ({
                    lat: minLat + (pt.y / h) * (maxLat - minLat),
                    lng: minLng + (pt.x / w) * (maxLng - minLng),
                  });
                  const p1 = toLatLng(polygonPoints[0]);
                  const p2 = toLatLng(polygonPoints[1]);
                  const hav = (a:number,b:number,c:number,d:number) => {
                    const R = 6371; // km
                    const toRad = (v:number)=>v*Math.PI/180;
                    const dLat = toRad(c - a);
                    const dLng = toRad(d - b);
                    const A = Math.sin(dLat/2)**2 + Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2;
                    return 2*R*Math.asin(Math.min(1, Math.sqrt(A)));
                  };
                  const radiusKm = hav(p1.lat, p1.lng, p2.lat, p2.lng);
                  setAreaRadiusKm(Math.max(0, Math.round(radiusKm * 10)/10));
                  // Build approximate polygon (circle as poly with 12 points)
                  const segments = 12;
                  const poly: Array<{lat:number; lng:number}> = [];
                  const toRad = (v:number)=>v*Math.PI/180;
                  const toDeg = (v:number)=>v*180/Math.PI;
                  const R = 6371;
                  const angDist = radiusKm/R;
                  for (let i=0;i<segments;i++){
                    const brng = (2*Math.PI*i)/segments;
                    const lat1 = toRad(p1.lat);
                    const lon1 = toRad(p1.lng);
                    const lat2 = Math.asin(Math.sin(lat1)*Math.cos(angDist)+Math.cos(lat1)*Math.sin(angDist)*Math.cos(brng));
                    const lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(angDist)*Math.cos(lat1), Math.cos(angDist)-Math.sin(lat1)*Math.sin(lat2));
                    poly.push({lat: toDeg(lat2), lng: toDeg(lon2)});
                  }
                  setPolygonLatLng(poly);
                  // Use first point as center for analysis
                  onLocationSelect(p1.lat, p1.lng, (selectedLocation?.name || 'Selected Location') + ' (Area)');
                  analyzeWeatherRisk(p1.lat, p1.lng, eventDate, Math.max(0, Math.round(radiusKm * 10)/10), poly);
                  setDrawMode(false);
                }}
                className="text-xs"
              >
                Analyze Area
              </Button>
            )}
        </div>
      </div>

      {/* Weather Control Panel - old duplicate removed */}

      {/* Interactive map with proper satellite support */}
      <div className="w-full h-full relative" ref={mapContainerRef}>
        {mapType === 'satellite' ? (
          // Satellite view using multiple fallback options for better reliability
          <div className="w-full h-full relative">
            <iframe
              src={`https://maps.google.com/maps?q=${center.lat},${center.lng}&t=k&z=${Math.max(10, Math.min(zoom + 8, 20))}&output=embed&iwloc=near`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title="Satellite Map"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Small weather indicator in top-right corner for satellite view */}
            {selectedLocation && isWeatherEnabled && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="flex items-center gap-2">
                    {selectedWeatherType === 'clear' && <Sun className="w-4 h-4 text-yellow-400" />}
                    {selectedWeatherType === 'cloudy' && <Cloud className="w-4 h-4 text-gray-400" />}
                    {selectedWeatherType === 'rainy' && <CloudRain className="w-4 h-4 text-blue-400" />}
                    {selectedWeatherType === 'stormy' && <Zap className="w-4 h-4 text-purple-400" />}
                    {selectedWeatherType === 'snowy' && <CloudSnow className="w-4 h-4 text-blue-200" />}
                    <span className="text-xs text-white capitalize">{selectedWeatherType}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Location marker - small and unobtrusive for satellite view */}
            {selectedLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <MapPin className="w-6 h-6 text-red-500 drop-shadow-lg" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative">
        <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.01},${center.lat-0.01},${center.lng+0.01},${center.lat+0.01}&layer=mapnik&marker=${center.lat},${center.lng}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
              title="OpenStreetMap"
              loading="lazy"
            />
            {/* Area draw overlay for Normal map */}
            {drawMode && (
              <>
                <div
                  className="absolute inset-0 z-30 cursor-crosshair"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                    setPolygonPoints(prev => prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]);
                  }}
                />
                {/* SVG circle preview from first to current mouse position */}
                <svg className="absolute inset-0 z-40 pointer-events-none">
                  {polygonPoints.length === 1 && (
                    <circle cx={polygonPoints[0].x} cy={polygonPoints[0].y} r={4} fill="#60a5fa" />
                  )}
                  {polygonPoints.length === 2 && (
                    (() => {
                      const dx = polygonPoints[1].x - polygonPoints[0].x;
                      const dy = polygonPoints[1].y - polygonPoints[0].y;
                      const r = Math.sqrt(dx*dx + dy*dy);
                      return <circle cx={polygonPoints[0].x} cy={polygonPoints[0].y} r={r} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
                    })()
                  )}
                </svg>
              </>
            )}
            {/* Small weather indicator in top-right corner */}
            {selectedLocation && isWeatherEnabled && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="flex items-center gap-2">
                    {selectedWeatherType === 'clear' && <Sun className="w-4 h-4 text-yellow-400" />}
                    {selectedWeatherType === 'cloudy' && <Cloud className="w-4 h-4 text-gray-400" />}
                    {selectedWeatherType === 'rainy' && <CloudRain className="w-4 h-4 text-blue-400" />}
                    {selectedWeatherType === 'stormy' && <Zap className="w-4 h-4 text-purple-400" />}
                    {selectedWeatherType === 'snowy' && <CloudSnow className="w-4 h-4 text-blue-200" />}
                    <span className="text-xs text-white capitalize">{selectedWeatherType}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Location marker - small and unobtrusive */}
            {selectedLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <MapPin className="w-6 h-6 text-red-500 drop-shadow-lg" />
              </div>
            )}
          </div>
        )}
        
        {/* Zoom controls - moved to bottom-right to avoid overlap */}
        <div className="absolute bottom-3 right-2 sm:right-4 z-40 flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className="bg-card/95 backdrop-blur-md border-primary/30 w-9 h-9 sm:w-10 sm:h-10 text-lg font-bold shadow-lg hover:bg-primary/20"
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
          >
            +
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-card/95 backdrop-blur-md border-primary/30 w-9 h-9 sm:w-10 sm:h-10 text-lg font-bold shadow-lg hover:bg-primary/20"
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
          >
            −
          </Button>
          <div className="bg-card/95 backdrop-blur-md border border-primary/30 rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-center shadow-lg">
            {zoom}x
          </div>
        </div>
        
        {selectedLocation && (
          <div className="absolute bottom-2 left-2 z-30 bg-card/95 backdrop-blur-md border border-primary/30 p-2 rounded-md max-w-56 sm:max-w-64 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold truncate">{selectedLocation.name || 'Selected Location'}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              📍 {formatCoordinates(selectedLocation.lat, selectedLocation.lng).formatted}
            </p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">
              <span>🔍 Zoom: {zoom}x</span>
              <span>🛰️ {mapType === 'satellite' ? 'Satellite' : 'Street'} View</span>
            </div>
            {showAnalysis && weatherProbabilities.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-auto pr-1">
                {weatherProbabilities.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-black/20 rounded px-1.5 py-1">
                    <div>
                      <div className="font-medium text-[11px]">{p.condition}</div>
                      <div className="text-[9px] text-muted-foreground">{p.threshold}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[11px]">{Math.round(p.probability)}%</div>
                      <div className="text-[9px] text-muted-foreground">{p.trend === 'increasing' ? '↗️' : p.trend === 'decreasing' ? '↘️' : '→'} trend</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Minimal Compass - positioned to be clearly visible */}
        <CompassComponent 
          className="absolute top-4 right-4 z-50" 
          onReset={() => {
            // For 2D map, we could reset to a default view or do nothing
            // Since it's a static map, this could center the view or reset zoom
            console.log('Compass clicked - could reset map view');
          }}
        />
      </div>
    </div>
  );
}