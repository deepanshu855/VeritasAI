import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = ({ activeSection, onNavClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (section) => {
    onNavClick(section);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Navbar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <button 
            className="nav-logo logo-btn" 
            onClick={() => handleNavClick("hero")}
          >
            VeritasAI
          </button>
          
          <div className="nav-desktop">
            <button 
              className={`nav-link ${activeSection === "features" ? "active" : ""}`} 
              onClick={() => handleNavClick("features")}
            >
              Features
            </button>
            <button 
              className={`nav-link ${activeSection === "about" ? "active" : ""}`} 
              onClick={() => handleNavClick("about")}
            >
              About
            </button>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </div>
          
          <button 
            className="nav-mobile-toggle" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      <div className={`mobile-dropdown ${isOpen ? "open" : ""}`}>
        <button 
          className={`mobile-link ${activeSection === "features" ? "active" : ""}`} 
          onClick={() => handleNavClick("features")}
        >
          Features
        </button>
        <button 
          className={`mobile-link ${activeSection === "about" ? "active" : ""}`} 
          onClick={() => handleNavClick("about")}
        >
          About
        </button>
        <Link to="/register" className="mobile-btn" onClick={() => setIsOpen(false)}>
          Get Started
        </Link>
      </div>
    </>
  );
};

export default Navbar;