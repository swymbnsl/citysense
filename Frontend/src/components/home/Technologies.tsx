
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Tech stack with icons and descriptions
const technologies = [
  {
    name: "React",
    icon: "/assets/react.svg", 
    description: "Frontend library for building user interfaces"
  },
  {
    name: "ESP32",
    icon: "/assets/esp32.svg", 
    description: "Microcontroller for IoT sensors and data collection"
  },
  {
    name: "TensorFlow",
    icon: "/assets/tensorflow.svg",
    description: "Machine learning framework for AI-based detection"
  },
  {
    name: "Supabase",
    icon: "/assets/supabase.svg",
    description: "Backend database and authentication services"
  },
  {
    name: "YOLOv8",
    icon: "/assets/yolo.svg",
    description: "Computer vision model for real-time object detection"
  },
  {
    name: "MQTT",
    icon: "/assets/mqtt.svg",
    description: "Messaging protocol for IoT device communication"
  },
  {
    name: "PostgreSQL",
    icon: "/assets/postgresql.svg",
    description: "Relational database for structured data storage"
  },
  {
    name: "MapBox",
    icon: "/assets/mapbox.svg",
    description: "Interactive mapping and location services"
  }
];

const Technologies = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Technologies Used</h2>
          <p className="text-citysense-text-secondary max-w-2xl mx-auto">
            CitySense leverages cutting-edge technologies to deliver accurate, real-time 
            monitoring and insights for urban environments.
          </p>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap pb-6" type="always">
          <div className="inline-flex space-x-8 px-4">
            {technologies.map((tech, index) => (
              <div 
                key={tech.name}
                className="w-48 flex-none rounded-xl p-6 bg-citysense-background shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                    <div className="text-2xl font-semibold">{tech.name.slice(0,1)}</div>
                  </div>
                </div>
                <h3 className="font-semibold text-center mb-2">{tech.name}</h3>
                <p className="text-sm text-citysense-text-secondary text-center">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
};

export default Technologies;
