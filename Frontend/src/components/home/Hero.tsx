
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  useEffect(() => {
    // Initialize the animation for the SVG lines
    const cityscapePaths = document.querySelectorAll('.cityscape-anim path');
    cityscapePaths.forEach((path, index) => {
      const pathElement = path as SVGPathElement;
      const length = pathElement.getTotalLength();
      
      // Set up the starting positions
      pathElement.style.strokeDasharray = length.toString();
      pathElement.style.strokeDashoffset = length.toString();
      
      // Trigger a layout to get the correct values
      pathElement.getBoundingClientRect();
      
      // Define the animation
      pathElement.style.transition = `stroke-dashoffset 2s ease-in-out ${index * 0.1}s`;
      pathElement.style.strokeDashoffset = '0';
    });
  }, []);

  return (
    <section className="relative pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-citysense-background to-white z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 opacity-0 animate-fade-in">
              Smart Urban <span className="text-citysense-green">Monitoring</span>
            </h1>
            
            <p className="text-lg text-citysense-text-secondary mb-8 max-w-lg opacity-0 animate-fade-in-delay-1">
              CitySense uses IoT and AI to monitor urban problems like air pollution, potholes, hygiene issues, and waterlogging in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 opacity-0 animate-fade-in-delay-2">
              <Button className="bg-citysense-green hover:bg-citysense-green/90 text-white">
                Explore Features
              </Button>
              <Button variant="outline" className="border-citysense-green text-citysense-green hover:bg-citysense-green/10">
                View Live Map
              </Button>
            </div>

          
          </div>
          
          <div className="w-full lg:w-1/2 relative opacity-0 animate-fade-in-delay-2">
            {/* Cityscape SVG with animation */}
            <svg className="w-full cityscape-anim" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* City Skyline */}
              <path d="M50,350 L50,250 L100,250 L100,200 L150,200 L150,250 L200,250 L200,150 L250,150 L250,250 L300,250 L300,200 L350,200 L350,100 L400,100 L400,200 L450,200 L450,250 L500,250 L500,150 L550,150 L550,250 L600,250 L600,200 L650,200 L650,300 L700,300 L700,350" 
                  stroke="#4E9F3D" strokeWidth="2" fill="none" />
                  
              {/* Roads */}
              <path d="M0,400 L800,400" stroke="#1E1E1E" strokeWidth="3" strokeDasharray="10, 10" />
              <path d="M400,400 L400,500" stroke="#1E1E1E" strokeWidth="3" strokeDasharray="10, 10" />
              
              {/* Buildings with windows */}
              <rect x="120" y="220" width="60" height="130" fill="#F4F7FA" stroke="#6C757D" strokeWidth="1" />
              <rect x="130" y="230" width="10" height="10" fill="#3ABEFF" />
              <rect x="150" y="230" width="10" height="10" fill="#3ABEFF" />
              <rect x="130" y="250" width="10" height="10" fill="#3ABEFF" />
              <rect x="150" y="250" width="10" height="10" fill="#3ABEFF" />
              <rect x="130" y="270" width="10" height="10" fill="#3ABEFF" />
              <rect x="150" y="270" width="10" height="10" fill="#3ABEFF" />
              
              <rect x="220" y="170" width="80" height="180" fill="#F4F7FA" stroke="#6C757D" strokeWidth="1" />
              <rect x="235" y="190" width="15" height="15" fill="#3ABEFF" />
              <rect x="270" y="190" width="15" height="15" fill="#3ABEFF" />
              <rect x="235" y="220" width="15" height="15" fill="#3ABEFF" />
              <rect x="270" y="220" width="15" height="15" fill="#3ABEFF" />
              <rect x="235" y="250" width="15" height="15" fill="#3ABEFF" />
              <rect x="270" y="250" width="15" height="15" fill="#3ABEFF" />
              
              <rect x="350" y="120" width="45" height="230" fill="#F4F7FA" stroke="#6C757D" strokeWidth="1" />
              <rect x="360" y="140" width="10" height="10" fill="#3ABEFF" />
              <rect x="375" y="140" width="10" height="10" fill="#3ABEFF" />
              <rect x="360" y="160" width="10" height="10" fill="#3ABEFF" />
              <rect x="375" y="160" width="10" height="10" fill="#3ABEFF" />
              <rect x="360" y="180" width="10" height="10" fill="#3ABEFF" />
              <rect x="375" y="180" width="10" height="10" fill="#3ABEFF" />
              
              {/* Traffic Lights */}
              <g className="traffic-light" transform="translate(500, 320)">
                <rect x="0" y="0" width="10" height="30" fill="#333" rx="2" />
                <circle cx="5" cy="5" r="4" fill="#FF6B6B" className="red" />
                <circle cx="5" cy="15" r="4" fill="#FFD166" className="yellow" />
                <circle cx="5" cy="25" r="4" fill="#4E9F3D" className="green" />
              </g>
              
              {/* IoT Sensors */}
              <circle cx="150" cy="150" r="5" fill="#4E9F3D" className="animate-pulse-light" />
              <circle cx="300" cy="180" r="5" fill="#3ABEFF" className="animate-pulse-light" />
              <circle cx="450" cy="230" r="5" fill="#FF6B6B" className="animate-pulse-light" />
              <circle cx="600" cy="200" r="5" fill="#4E9F3D" className="animate-pulse-light" />
              
              {/* Data Transmission Lines */}
              <path d="M150,150 Q225,50 300,180" stroke="#4E9F3D" strokeWidth="1" strokeDasharray="2, 2" />
              <path d="M300,180 Q375,100 450,230" stroke="#3ABEFF" strokeWidth="1" strokeDasharray="2, 2" />
              <path d="M450,230 Q525,150 600,200" stroke="#FF6B6B" strokeWidth="1" strokeDasharray="2, 2" />
            </svg>
            
            {/* IoT Devices */}
            <div className="absolute top-1/3 right-1/4 w-20 h-20 neumorphic p-4 flex items-center justify-center opacity-0 animate-fade-in-delay-3">
              <div className="h-4 w-16 bg-citysense-green rounded-full relative">
                <div className="absolute top-6 left-7 h-2 w-2 bg-citysense-green rounded-full animate-ping"></div>
              </div>
            </div>
            
            <div className="absolute bottom-1/4 left-1/3 w-24 h-24 neumorphic p-4 flex items-center justify-center opacity-0 animate-fade-in-delay-4">
              <div className="h-16 w-4 bg-citysense-blue rounded-full relative">
                <div className="absolute top-2 left-6 h-2 w-2 bg-citysense-blue rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
