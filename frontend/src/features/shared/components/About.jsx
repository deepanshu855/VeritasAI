import React from "react";
import { Search, Layout, CheckCircle } from "lucide-react";
import "../styles/about.css"

const About = () => {
  return (
    <section className="about-section centered-section">
      <div className="about-container">
        <h2 className="section-title">Built to make knowledge accessible.</h2>

        <div className="about-points">
          <div className="about-point">
            <Search size={20} className="point-icon" />
            <span><strong>Real-time intelligence.</strong> Merging AI with live web search.</span>
          </div>
          
          <div className="about-point">
            <Layout size={20} className="point-icon" />
            <span><strong>Distraction-free.</strong> A minimal interface built for focus.</span>
          </div>
          
          <div className="about-point">
            <CheckCircle size={20} className="point-icon" />
            <span><strong>Truth that matters.</strong> Delivering accurate, up-to-date answers.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;