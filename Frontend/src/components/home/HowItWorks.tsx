
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const flowSteps = [
  {
    id: 1,
    title: "Data Collection",
    description: "IoT sensors gather environmental data and cameras capture visual information across the city.",
    color: "citysense-blue"
  },
  {
    id: 2,
    title: "Data Transmission",
    description: "Collected data is securely transmitted to our cloud servers for processing and analysis.",
    color: "citysense-green"
  },
  {
    id: 3,
    title: "AI Analysis",
    description: "Our advanced algorithms process the data to identify problems and predict potential issues.",
    color: "citysense-text-primary"
  },
  {
    id: 4,
    title: "Alert Generation",
    description: "When problems are detected, the system generates alerts and notifies relevant authorities.",
    color: "citysense-red"
  },
  {
    id: 5,
    title: "Visualization",
    description: "Data and alerts are visualized on interactive maps for easy monitoring and decision making.",
    color: "citysense-green"
  }
];

const HowItWorks = () => {
  const flowchartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add animation classes to each step when in view
          const steps = flowchartRef.current?.querySelectorAll('.flow-step');
          steps?.forEach((step, index) => {
            setTimeout(() => {
              step.classList.add('revealed');
            }, 300 * index); // Stagger the animations
          });
          
          // Animate the connector lines
          const connectors = flowchartRef.current?.querySelectorAll('.flow-connector');
          connectors?.forEach((connector, index) => {
            setTimeout(() => {
              connector.classList.add('revealed');
            }, 300 * index + 150); // Offset from steps
          });
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    if (flowchartRef.current) {
      observer.observe(flowchartRef.current);
    }
    
    return () => {
      if (flowchartRef.current) {
        observer.unobserve(flowchartRef.current);
      }
    };
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How CitySense Works</h2>
          <p className="text-citysense-text-secondary max-w-2xl mx-auto">
            Our end-to-end solution transforms raw sensor data into actionable insights 
            through a seamless process of collection, analysis, and visualization.
          </p>
        </div>
        
        <div 
          ref={flowchartRef}
          className="relative py-8"
        >
          {/* Desktop Flowchart */}
          <div className="hidden md:block">
            <div className="flex justify-between items-center">
              {flowSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={`flow-step reveal-on-scroll w-40 text-center`}>
                    <div className={`h-16 w-16 rounded-full bg-${step.color}/10 flex items-center justify-center mx-auto mb-4 border-2 border-${step.color}`}>
                      <span className={`text-xl font-bold text-${step.color}`}>{step.id}</span>
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-citysense-text-secondary">{step.description}</p>
                  </div>
                  
                  {index < flowSteps.length - 1 && (
                    <div className="flow-connector reveal-on-scroll w-8 relative">
                      <ArrowRight className="text-citysense-text-secondary" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 -z-10 bg-gray-200"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Mobile Flowchart (Vertical) */}
          <div className="md:hidden">
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              
              {flowSteps.map((step) => (
                <div key={step.id} className="flow-step reveal-on-scroll pl-12 relative">
                  <div className={`absolute left-0 h-8 w-8 rounded-full bg-${step.color}/10 flex items-center justify-center border-2 border-${step.color}`}>
                    <span className={`text-sm font-bold text-${step.color}`}>{step.id}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-citysense-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
