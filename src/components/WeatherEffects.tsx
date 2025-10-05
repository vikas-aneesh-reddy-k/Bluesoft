import { useEffect, useRef } from 'react';

interface WeatherEffectsProps {
  type?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  intensity?: number;
}

export function WeatherEffects({ type = 'clear', intensity = 50 }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Scale the context to match the device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    interface Cloud {
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      opacity: number;
    }

    interface Particle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color?: string;
      length?: number;
    }

    const particles: Particle[] = [];
    const clouds: Cloud[] = [];
    let lightning = { active: false, opacity: 0 };
    let sunRays: { angle: number; intensity: number } = { angle: 0, intensity: 1 };

    // Initialize clouds for cloudy/rainy/stormy weather - Enhanced
    if (type === 'cloudy' || type === 'rainy' || type === 'stormy') {
      const cloudCount = type === 'cloudy' ? 8 : type === 'rainy' ? 6 : 5;
      for (let i = 0; i < cloudCount; i++) {
        clouds.push({
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight * 0.4,
          width: 200 + Math.random() * 150,
          height: 80 + Math.random() * 60,
          speed: 0.1 + Math.random() * 0.2,
          opacity: type === 'stormy' ? 0.9 : type === 'cloudy' ? 0.7 : 0.6,
        });
      }
    }

    // Initialize particles based on weather type - higher quality rain
    const particleCount = type === 'clear' ? 30 : Math.min(intensity * 2, 200); // More particles for better quality
    
    for (let i = 0; i < particleCount; i++) {
      if (type === 'rainy' || type === 'stormy') {
        particles.push({
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight - displayHeight,
          z: Math.random() * 1000,
          vx: type === 'stormy' ? (Math.random() - 0.5) * 2 : 0,
          vy: type === 'stormy' ? Math.random() * 8 + 6 : Math.random() * 5 + 3,
          size: Math.random() * 1.5 + 0.5, // Thinner, more realistic rain
          opacity: Math.random() * 0.6 + 0.4, // Higher opacity for visibility
          length: type === 'stormy' ? 25 : 20, // Longer rain drops
          color: type === 'stormy' ? 'rgba(120, 160, 255, ' : 'rgba(100, 150, 220, ',
        });
      } else if (type === 'snowy') {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 1,
          vy: Math.random() * 2 + 0.5,
          size: Math.random() * 4 + 2,
          opacity: Math.random() * 0.6 + 0.4,
          color: 'rgba(255, 255, 255, ',
        });
      } else if (type === 'clear') {
        // Floating dust particles and light rays for sunny weather
        particles.push({
          x: Math.random() * displayWidth,
          y: Math.random() * displayHeight,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.4 + 0.2,
          color: 'rgba(255, 255, 180, ',
        });
      }
    }

    function drawCloud(cloud: Cloud) {
      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      
      // Create beautiful cloud gradient based on weather type
      const centerX = cloud.x + cloud.width / 2;
      const centerY = cloud.y + cloud.height / 2;
      const radius = Math.max(cloud.width, cloud.height) / 2;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      if (type === 'stormy') {
        gradient.addColorStop(0, 'rgba(60, 60, 70, 0.95)');
        gradient.addColorStop(0.3, 'rgba(80, 80, 90, 0.8)');
        gradient.addColorStop(0.7, 'rgba(100, 100, 110, 0.6)');
        gradient.addColorStop(1, 'rgba(120, 120, 130, 0.3)');
      } else if (type === 'cloudy') {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.2, 'rgba(245, 245, 250, 0.9)');
        gradient.addColorStop(0.5, 'rgba(230, 235, 240, 0.7)');
        gradient.addColorStop(0.8, 'rgba(200, 210, 220, 0.5)');
        gradient.addColorStop(1, 'rgba(180, 190, 200, 0.2)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(240, 245, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(220, 225, 230, 0.3)');
      }
      
      ctx.fillStyle = gradient;
      
      // Draw realistic cloud shape with multiple overlapping circles
      const circles = type === 'cloudy' ? 8 : 6;
      for (let i = 0; i < circles; i++) {
        const angle = (i / circles) * Math.PI * 2;
        const offsetX = Math.cos(angle) * (cloud.width / 3) * (0.7 + Math.random() * 0.6);
        const offsetY = Math.sin(angle) * (cloud.height / 4) * (0.7 + Math.random() * 0.6);
        const circleRadius = (cloud.width / 4) * (0.8 + Math.random() * 0.4);
        
        ctx.beginPath();
        ctx.arc(
          centerX + offsetX,
          centerY + offsetY,
          circleRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Add subtle shadow for depth
      ctx.shadowBlur = 10;
      ctx.shadowColor = type === 'stormy' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Redraw the main cloud shape for shadow effect
      for (let i = 0; i < circles; i++) {
        const angle = (i / circles) * Math.PI * 2;
        const offsetX = Math.cos(angle) * (cloud.width / 3) * (0.7 + Math.random() * 0.6);
        const offsetY = Math.sin(angle) * (cloud.height / 4) * (0.7 + Math.random() * 0.6);
        const circleRadius = (cloud.width / 4) * (0.8 + Math.random() * 0.4);
        
        ctx.beginPath();
        ctx.arc(
          centerX + offsetX,
          centerY + offsetY,
          circleRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      ctx.restore();
    }

    function drawSunRays() {
      if (type !== 'clear') return;
      
      ctx.save();
      ctx.globalAlpha = 0.4;
      
      const centerX = displayWidth * 0.8;
      const centerY = displayHeight * 0.2;
      
      // Draw beautiful sun with multiple layers
      const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120);
      sunGradient.addColorStop(0, 'rgba(255, 255, 180, 1)');
      sunGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.9)');
      sunGradient.addColorStop(0.7, 'rgba(255, 255, 220, 0.6)');
      sunGradient.addColorStop(1, 'rgba(255, 255, 240, 0.2)');
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw inner sun core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
      coreGradient.addColorStop(0, 'rgba(255, 255, 150, 1)');
      coreGradient.addColorStop(1, 'rgba(255, 255, 180, 0.8)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw animated sun rays with gradient
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      
      for (let i = 0; i < 16; i++) {
        const angle = (i * 22.5 + sunRays.angle) * Math.PI / 180;
        const rayLength = 150 + Math.sin(sunRays.angle * 0.01 + i) * 30;
        
        const x1 = centerX + Math.cos(angle) * 130;
        const y1 = centerY + Math.sin(angle) * 130;
        const x2 = centerX + Math.cos(angle) * rayLength;
        const y2 = centerY + Math.sin(angle) * rayLength;
        
        // Create gradient for each ray
        const rayGradient = ctx.createLinearGradient(x1, y1, x2, y2);
        rayGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        rayGradient.addColorStop(0.5, 'rgba(255, 255, 220, 0.4)');
        rayGradient.addColorStop(1, 'rgba(255, 255, 240, 0.1)');
        
        ctx.strokeStyle = rayGradient;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(255, 255, 200, 0.5)';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      // Add warm glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 255, 200, 0.3)';
      ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    function drawLightning() {
      if (!lightning.active || type !== 'stormy') return;
      
      ctx.save();
      ctx.globalAlpha = lightning.opacity;
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(150, 150, 255, 1)';
      
      const startX = Math.random() * canvas.width;
      let currentX = startX;
      let currentY = 0;
      
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      
      while (currentY < canvas.height) {
        currentY += Math.random() * 50 + 20;
        currentX += (Math.random() - 0.5) * 100;
        ctx.lineTo(currentX, currentY);
      }
      
      ctx.stroke();
      ctx.restore();
    }

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sun rays for clear weather
      if (type === 'clear') {
        drawSunRays();
        sunRays.angle += 0.1;
      }

      // Draw and update clouds
      clouds.forEach((cloud) => {
        drawCloud(cloud);
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + cloud.width) {
          cloud.x = -cloud.width;
        }
      });

      // Lightning for stormy weather
      if (type === 'stormy') {
        if (Math.random() > 0.98 && !lightning.active) {
          lightning.active = true;
          lightning.opacity = 1;
        }
        if (lightning.active) {
          drawLightning();
          lightning.opacity -= 0.1;
          if (lightning.opacity <= 0) {
            lightning.active = false;
          }
        }
      }

      // Draw and update particles
      particles.forEach((particle) => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;

        if (type === 'rainy' || type === 'stormy') {
          // Draw high-quality rain with better anti-aliasing
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Create a more realistic gradient for rain drops
          const gradient = ctx.createLinearGradient(
            particle.x, particle.y,
            particle.x, particle.y + (particle.length || 20)
          );
          gradient.addColorStop(0, particle.color + '0.9)');
          gradient.addColorStop(0.3, particle.color + '0.7)');
          gradient.addColorStop(1, particle.color + '0.1)');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = particle.size;
          ctx.shadowBlur = 2;
          ctx.shadowColor = particle.color + '0.3)';
          
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx, particle.y + (particle.length || 20));
          ctx.stroke();
          
          // Reset shadow for other elements
          ctx.shadowBlur = 0;
        } else if (type === 'snowy') {
          // Draw snowflakes
          ctx.fillStyle = particle.color + particle.opacity + ')';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add snowflake pattern
          ctx.strokeStyle = particle.color + (particle.opacity * 0.5) + ')';
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(
              particle.x + Math.cos(angle) * particle.size * 2,
              particle.y + Math.sin(angle) * particle.size * 2
            );
            ctx.stroke();
          }
        } else if (type === 'clear') {
          // Draw floating dust/pollen particles
          ctx.fillStyle = particle.color + particle.opacity + ')';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.y > canvas.height) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;

        // Floating motion for clear weather
        if (type === 'clear') {
          particle.vx += (Math.random() - 0.5) * 0.01;
          particle.vy += (Math.random() - 0.5) * 0.01;
          particle.vx *= 0.99;
          particle.vy *= 0.99;
        }

        // Swaying motion for snow
        if (type === 'snowy') {
          particle.vx = Math.sin(Date.now() * 0.001 + particle.x) * 0.5;
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      canvas.width = displayWidth * devicePixelRatio;
      canvas.height = displayHeight * devicePixelRatio;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';

      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
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
      style={{ 
        opacity: type === 'clear' ? 0.4 : type === 'rainy' ? 0.6 : 0.7,
        filter: type === 'rainy' ? 'blur(0.5px)' : 'none' // Subtle blur for rain effect
      }}
    />
  );
}