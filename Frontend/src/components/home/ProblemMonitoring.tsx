
import React, { useEffect, useRef } from 'react';
import { 
  Wind, 
  AlertCircle, 
  Trash2, 
  Droplets 
} from 'lucide-react';

interface MonitoringBlockProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

const MonitoringBlock: React.FC<MonitoringBlockProps> = ({ 
  title, 
  description, 
  icon, 
  color, 
  delay 
}) => {
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => {
      if (blockRef.current) {
        observer.unobserve(blockRef.current);
      }
    };
  }, [delay]);

  return (
    <div 
      ref={blockRef} 
      className={`reveal-on-scroll rounded-lg p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-${color}`}
    >
      <div className={`inline-flex items-center justify-center p-3 bg-${color}/10 rounded-full mb-4`}>
        {React.cloneElement(icon as React.ReactElement, { 
          className: `h-6 w-6 text-${color}` 
        })}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-citysense-text-secondary">{description}</p>
    </div>
  );
};

const ProblemMonitoring = () => {
  return (
    <section className="py-16 bg-gradient-to-t from-white to-citysense-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Urban Problem Monitoring</h2>
          <p className="text-citysense-text-secondary max-w-2xl mx-auto">
            CitySense provides comprehensive monitoring for key urban challenges, 
            helping city administrators and citizens address problems proactively.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MonitoringBlock 
            title="Air Pollution" 
            description="Real-time monitoring of air quality index, particulate matter, and harmful gases across the city."
            icon={<Wind />}
            color="citysense-blue"
            delay={100}
          />
          
          <MonitoringBlock 
            title="Road Conditions" 
            description="Automated detection of potholes, cracks, and road damages for quick repairs and safer commutes."
            icon={<AlertCircle />}
            color="citysense-red"
            delay={200}
          />
          
          <MonitoringBlock 
            title="Hygiene Issues" 
            description="Identifying garbage dumps, sewage problems, and other sanitation concerns for immediate action."
            icon={<Trash2 />}
            color="citysense-green"
            delay={300}
          />
          
          <MonitoringBlock 
            title="Urban Flooding" 
            description="Monitoring water levels and providing early warnings for potential waterlogging and flooding zones."
            icon={<Droplets />}
            color="citysense-blue"
            delay={400}
          />
        </div>
      </div>
    </section>
  );
};

export default ProblemMonitoring;
