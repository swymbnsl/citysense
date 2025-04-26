
import React, { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import ProblemMonitoring from '@/components/home/ProblemMonitoring';
import HowItWorks from '@/components/home/HowItWorks';
import MapSection from '@/components/home/MapSection';
import Technologies from '@/components/home/Technologies';

const Index = () => {
  // Setup intersection observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Observe all elements with reveal-on-scroll class
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <MapSection />
        <ProblemMonitoring />
        <HowItWorks />
        <Technologies />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
