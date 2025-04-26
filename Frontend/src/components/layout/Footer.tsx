
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center">
              <span className="h-8 w-8 rounded-full bg-citysense-green flex items-center justify-center mr-2">
                <MapPin className="h-5 w-5 text-white" />
              </span>
              <span className="text-xl font-outfit font-semibold text-citysense-text-primary">CitySense</span>
            </Link>
            <p className="mt-4 text-sm text-citysense-text-secondary">
              Smart urban monitoring for a better city experience. Real-time insights for urban challenges.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-citysense-text-primary tracking-wider uppercase">Navigation</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Home</Link></li>
              <li><Link to="/features" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Features</Link></li>
              <li><Link to="/about" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-citysense-text-primary tracking-wider uppercase">Features</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Air Pollution Monitoring</a></li>
              <li><a href="#" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Pothole Detection</a></li>
              <li><a href="#" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Hygiene Issues</a></li>
              <li><a href="#" className="text-sm text-citysense-text-secondary hover:text-citysense-green transition-colors">Urban Flooding Alerts</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-citysense-text-primary tracking-wider uppercase">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-citysense-green mt-0.5 mr-2" />
                <span className="text-sm text-citysense-text-secondary">info@citysense.tech</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-citysense-green mt-0.5 mr-2" />
                <span className="text-sm text-citysense-text-secondary">+91 123 456 7890</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-citysense-green mt-0.5 mr-2" />
                <span className="text-sm text-citysense-text-secondary">Delhi NCR, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-sm text-center text-citysense-text-secondary">
            © {new Date().getFullYear()} CitySense. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
