
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed w-full bg-white/75 backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="h-8 w-8 rounded-full bg-citysense-green flex items-center justify-center mr-2">
                <MapPin className="h-5 w-5 text-white" />
              </span>
              <span className="text-xl font-outfit font-semibold text-citysense-text-primary">CitySense</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 text-citysense-text-primary hover:text-citysense-green transition-colors">Home</Link>
            <Link to="/features" className="px-3 py-2 text-citysense-text-primary hover:text-citysense-green transition-colors">Features</Link>
            <Link to="/about" className="px-3 py-2 text-citysense-text-primary hover:text-citysense-green transition-colors">About</Link>
            <Link to="/contact" className="px-3 py-2 text-citysense-text-primary hover:text-citysense-green transition-colors">Contact</Link>
            <Button variant="outline" className="ml-4 border-citysense-green text-citysense-green hover:bg-citysense-green hover:text-white transition-all">
              Get Started
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-citysense-text-primary hover:text-citysense-green focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              onClick={toggleMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-citysense-text-primary hover:text-citysense-green"
            >
              Home
            </Link>
            <Link 
              to="/features" 
              onClick={toggleMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-citysense-text-primary hover:text-citysense-green"
            >
              Features
            </Link>
            <Link 
              to="/about" 
              onClick={toggleMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-citysense-text-primary hover:text-citysense-green"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              onClick={toggleMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-citysense-text-primary hover:text-citysense-green"
            >
              Contact
            </Link>
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full border-citysense-green text-citysense-green hover:bg-citysense-green hover:text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
