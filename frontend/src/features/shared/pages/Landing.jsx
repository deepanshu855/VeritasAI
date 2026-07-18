import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import About from "../components/About";
import "../styles/landing.css";

const Landing = () => {
  const [activeSection, setActiveSection] = useState("hero"); // "hero", "features", or "about"

  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="landing-page">
      {/* Extracted Navbar Component */}
      <Navbar activeSection={activeSection} onNavClick={handleNavClick} />

      {/* Conditionally Rendered Main Content */}
      {activeSection === "hero" && (
        <main className="hero-section">
          <div className="hero-badge">
            <span className="badge-new">NEW</span>
            <span className="badge-text">VeritasAI is now live</span>
            <Sparkles size={14} className="badge-icon" />
          </div>

          <h1 className="hero-title">
            <span className="text-gradient">AI</span> that answers.
            <br />
            Truth that matters.
          </h1>

          <p className="hero-subtitle">
            <span className="hide-on-mobile">Ask anything. </span>
            Get accurate answers powered by AI
            <span className="hide-on-mobile"> and real-time web search</span>.
          </p>

          <div className="hero-ctas">
            <Link to="/dashboard" className="cta-primary">
              Start Chat <ArrowUpRight size={18} strokeWidth={2.5} />
            </Link>
            <button
              onClick={() => handleNavClick("features")}
              className="cta-secondary"
            >
              Learn More
            </button>
          </div>
        </main>
      )}

      {activeSection === "features" && <Features />}

      {activeSection === "about" && <About />}
    </div>
  );
};

export default Landing;
