import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface Globe3DProps {
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  selectedLocation?: { lat: number; lng: number; name?: string };
}

export function Globe3D({ onLocationSelect, selectedLocation }: Globe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const animate = () => {
      if (!containerRef.current || !isRotating) return;
      
      rotationRef.current += 0.5;
      const globe = containerRef.current.querySelector('.globe') as HTMLElement;
      if (globe) {
        globe.style.transform = `rotateY(${rotationRef.current}deg) rotateX(15deg)`;
      }
      
      requestAnimationFrame(animate);
    };

    animate();
  }, [isRotating]);

  const handleGlobeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to lat/lng (simplified)
    const lat = (0.5 - y) * 180;
    const lng = (x - 0.5) * 360;
    
    onLocationSelect(lat, lng);
    setIsRotating(false);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-96 h-96 cursor-pointer"
        onClick={handleGlobeClick}
        onMouseEnter={() => setIsRotating(false)}
        onMouseLeave={() => setIsRotating(true)}
      >
        {/* 3D Globe */}
        <div className="globe w-full h-full relative preserve-3d">
          {/* Globe sphere */}
          <div className="absolute inset-0 rounded-full bg-gradient-space border-2 border-primary/20 shadow-glow">
            {/* Continents overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial opacity-50"></div>
              
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {/* Latitude lines */}
                {[20, 40, 60, 80].map((y) => (
                  <line
                    key={`lat-${y}`}
                    x1="10"
                    y1={y}
                    x2="90"
                    y2={y}
                    stroke="rgba(99, 179, 237, 0.2)"
                    strokeWidth="0.2"
                  />
                ))}
                {/* Longitude lines */}
                {[20, 40, 60, 80].map((x) => (
                  <line
                    key={`lng-${x}`}
                    x1={x}
                    y1="10"
                    x2={x}
                    y2="90"
                    stroke="rgba(99, 179, 237, 0.2)"
                    strokeWidth="0.2"
                  />
                ))}
                {/* Equator */}
                <line
                  x1="10"
                  y1="50"
                  x2="90"
                  y2="50"
                  stroke="rgba(99, 179, 237, 0.4)"
                  strokeWidth="0.5"
                />
                {/* Prime meridian */}
                <line
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="90"
                  stroke="rgba(99, 179, 237, 0.4)"
                  strokeWidth="0.5"
                />
              </svg>

              {/* Atmospheric glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 to-transparent"></div>
            </div>
          </div>

          {/* Selected location pin */}
          {selectedLocation && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
              <MapPin className="w-8 h-8 text-accent-glow drop-shadow-glow" />
            </div>
          )}
        </div>

        {/* Orbital ring */}
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-spin-slow"></div>
        
        {/* Instructions */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-muted-foreground">Click to select location</p>
        </div>
      </div>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(99, 179, 237, 0.8));
        }
      `}</style>
    </div>
  );
}