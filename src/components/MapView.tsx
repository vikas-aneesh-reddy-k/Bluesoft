import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface MapViewProps {
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  selectedLocation?: { lat: number; lng: number; name?: string };
}

export function MapView({ onLocationSelect, selectedLocation }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize map (using Leaflet or Mapbox in production)
    // For demo, we'll simulate with a static map
    if (mapRef.current && selectedLocation) {
      // Update map view
    }
  }, [selectedLocation]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setIsLoading(true);
    // Simulate geocoding
    setTimeout(() => {
      // Example coordinates for demo
      const demoLocations: Record<string, { lat: number; lng: number }> = {
        'london': { lat: 51.5074, lng: -0.1278 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'tokyo': { lat: 35.6762, lng: 139.6503 },
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'rio': { lat: -22.9068, lng: -43.1729 },
      };
      
      const searchLower = searchQuery.toLowerCase();
      const location = demoLocations[searchLower] || { lat: 0, lng: 0 };
      onLocationSelect(location.lat, location.lng, searchQuery);
      setIsLoading(false);
    }, 500);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to lat/lng
    const lat = (0.5 - y) * 180;
    const lng = (x - 0.5) * 360;
    
    onLocationSelect(lat, lng);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect(
            position.coords.latitude,
            position.coords.longitude,
            'Current Location'
          );
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search bar */}
      <Card className="absolute top-4 left-4 right-4 z-20 bg-card/80 backdrop-blur-lg border-primary/20 md:left-1/2 md:-translate-x-1/2 md:w-96">
        <div className="flex gap-2 p-2">
          <Input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background/50"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            variant="glass"
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            onClick={getCurrentLocation}
            variant="glass"
            size="icon"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Map container */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="w-full h-full bg-gradient-space cursor-crosshair relative overflow-hidden"
      >
        {/* Simulated map grid */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 360 180">
            {/* Grid lines */}
            {Array.from({ length: 19 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 10}
                x2="360"
                y2={i * 10}
                stroke="rgba(99, 179, 237, 0.1)"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 37 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 10}
                y1="0"
                x2={i * 10}
                y2="180"
                stroke="rgba(99, 179, 237, 0.1)"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Equator and Prime Meridian */}
            <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(99, 179, 237, 0.3)" strokeWidth="1" />
            <line x1="180" y1="0" x2="180" y2="180" stroke="rgba(99, 179, 237, 0.3)" strokeWidth="1" />
            
            {/* Simple continent shapes */}
            <path
              d="M 100 60 Q 120 50 140 60 L 140 80 Q 120 90 100 80 Z"
              fill="rgba(99, 179, 237, 0.2)"
              stroke="rgba(99, 179, 237, 0.4)"
              strokeWidth="1"
            />
            <path
              d="M 200 70 Q 220 60 240 70 L 240 100 Q 220 110 200 100 Z"
              fill="rgba(99, 179, 237, 0.2)"
              stroke="rgba(99, 179, 237, 0.4)"
              strokeWidth="1"
            />
            <path
              d="M 260 90 Q 280 80 300 90 L 300 110 Q 280 120 260 110 Z"
              fill="rgba(99, 179, 237, 0.2)"
              stroke="rgba(99, 179, 237, 0.4)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Selected location marker */}
        {selectedLocation && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full animate-bounce"
            style={{
              left: `${((selectedLocation.lng + 180) / 360) * 100}%`,
              top: `${((90 - selectedLocation.lat) / 180) * 100}%`,
            }}
          >
            <MapPin className="h-8 w-8 text-accent drop-shadow-glow" />
            {selectedLocation.name && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-2 py-1 rounded text-xs whitespace-nowrap">
                {selectedLocation.name}
              </div>
            )}
          </div>
        )}

        {/* Atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20 pointer-events-none"></div>
      </div>

      <style>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(99, 179, 237, 0.8));
        }
      `}</style>
    </div>
  );
}