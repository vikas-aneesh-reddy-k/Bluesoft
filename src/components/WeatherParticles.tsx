import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface WeatherParticlesProps {
  type?: 'rain' | 'snow' | 'stars';
  intensity?: number;
}

export function WeatherParticles({ type = 'stars', intensity = 50 }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];

    // Initialize particles
    for (let i = 0; i < intensity; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: type === 'rain' ? 0 : (Math.random() - 0.5) * 0.5,
        vy: type === 'rain' ? Math.random() * 3 + 2 : type === 'snow' ? Math.random() * 1 + 0.5 : 0,
        size: type === 'stars' ? Math.random() * 2 : Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.y > canvas.height) particle.y = -10;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;

        if (type === 'rain') {
          // Draw rain
          const gradient = ctx.createLinearGradient(particle.x, particle.y, particle.x, particle.y + 10);
          gradient.addColorStop(0, 'rgba(99, 179, 237, 0.8)');
          gradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = particle.size / 2;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x, particle.y + 10);
          ctx.stroke();
        } else if (type === 'snow') {
          // Draw snow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw stars
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          const scale = 1000 / (1000 + particle.z);
          const x = particle.x * scale + canvas.width / 2 * (1 - scale);
          const y = particle.y * scale + canvas.height / 2 * (1 - scale);
          const size = particle.size * scale;
          
          // Twinkling effect
          particle.opacity = Math.sin(Date.now() * 0.001 + particle.x) * 0.3 + 0.7;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Update z for stars
        if (type === 'stars') {
          particle.z -= 2;
          if (particle.z <= 0) particle.z = 1000;
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [type, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ opacity: 0.6 }}
    />
  );
}