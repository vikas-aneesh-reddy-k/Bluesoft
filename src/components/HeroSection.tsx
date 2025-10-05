import { Button } from '@/components/ui/button';
import { WeatherParticles } from '@/components/WeatherParticles';
import { Cloud, MapPin, Calendar, TrendingUp, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="relative min-h-[80vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-space">
      {/* Background particles */}
      <WeatherParticles type="stars" intensity={100} />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-aurora opacity-20"></div>
      
      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
        {/* NASA & Bluesoft Badges */}
        <div className="inline-flex items-center justify-center gap-6 sm:gap-8 mb-8 flex-wrap">
          <img 
            src="/NSAC@2025 Harohalli icon.svg" 
            alt="NASA Space Apps Challenge 2025 - Harohalli" 
            className="h-28 w-28 sm:h-36 sm:w-36 md:h-48 md:w-48"
          />
          <img 
            src="/Bluesoft icon.svg" 
            alt="Bluesoft Team" 
            className="h-28 w-28 sm:h-36 sm:w-36 md:h-48 md:w-48"
          />
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in leading-tight">
          Will It Rain On My Parade?
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto animate-slide-up">
          Know the odds before you plan your day. Analyze historical weather data to predict
          conditions for your outdoor events months in advance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12 animate-scale-in">
          <Button onClick={onGetStarted} variant="hero" size="xl">
            <MapPin className="mr-2 h-5 w-5" />
            Check My Location
          </Button>
          <Button variant="glass" size="xl">
            <Cloud className="mr-2 h-5 w-5" />
            View Demo
          </Button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
          {[
            {
              icon: MapPin,
              title: "Drop a Pin",
              description: "Select any location worldwide with our interactive 3D globe or 2D map",
            },
            {
              icon: Calendar,
              title: "Pick Your Date",
              description: "Choose your event date and we'll analyze decades of weather patterns",
            },
            {
              icon: TrendingUp,
              title: "Get Insights",
              description: "See probabilities, trends, and get alternative date recommendations",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="group p-4 sm:p-5 bg-card/10 backdrop-blur-md border border-primary/10 rounded-xl hover:bg-card/20 hover:border-primary/30 transition-all hover:scale-105 hover:shadow-glow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex p-3 bg-gradient-primary rounded-lg mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-[15px] text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
          {[
            { value: "35+", label: "Years of Data (1990–2024)" },
            { value: "3+", label: "NASA Datasets (POWER, MERRA‑2, IMERG)" },
            { value: "<10s", label: "Typical Response Time" },
            { value: "100%", label: "Live Weather Enabled" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center animate-scale-in"
              style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
            >
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        {/* Footer (hero landing) */}
        <div className="mt-12 sm:mt-16 text-center text-xs sm:text-sm text-muted-foreground">
          <div className="mb-1">Made with <span role="img" aria-label="love">❤️</span> by</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            <span>Vikas Kakarla</span>
            <span>•</span>
            <span>Sujith Putta</span>
            <span>•</span>
            <span>Dhanya Potla</span>
            <span>•</span>
            <span>Charan Gonuguntla</span>
            <span>•</span>
            <span>Sameeksha Ambati</span>
            <span>•</span>
            <span>Vignatri M</span>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 sm:top-20 left-6 sm:left-10 animate-float opacity-30">
        <Cloud className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />
      </div>
      <div className="absolute bottom-10 sm:bottom-20 right-6 sm:right-10 animate-float opacity-30" style={{ animationDelay: '1s' }}>
        <MapPin className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 text-accent" />
      </div>
      <div className="absolute top-28 sm:top-40 right-10 sm:right-20 animate-float opacity-30" style={{ animationDelay: '2s' }}>
        <Calendar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-secondary" />
      </div>
    </div>
  );
}
