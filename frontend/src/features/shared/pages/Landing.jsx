import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Features from "../components/Features";
import About from "../components/About";
import "../styles/landing.css";
import ShapeGrid from "../background/ShapeGrid";

const Landing = () => {
  const [activeSection, setActiveSection] = useState("hero");

  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="landing">
      <ShapeGrid
        speed={0.6}
        squareSize={40}
        direction="diagonal" // up, down, left, right, diagonal
        borderColor="#2F293A"
        hoverFillColor="#222"
        shape="square" // square, hexagon, circle, triangle
        hoverTrailAmount={0} // number of trailing hovered shapes (0 = no trail)
        direction="up"
        hoverColor="#222222"
        size={40}
        shape="square"
      />

      <div className="landing-page landing-content">
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
              <Link to="/login" className="cta-primary">
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
    </div>
  );
};

export default Landing;
