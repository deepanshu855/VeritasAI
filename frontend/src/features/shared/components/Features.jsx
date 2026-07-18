import React from "react";
import {
  Globe,
  MessageSquare,
  FileText,
  History,
  ShieldCheck,
  Zap,
} from "lucide-react";
import "../styles/feature.css"

const Features = () => {
  const featuresList = [
    { title: "Real-Time Web Search", icon: <Globe size={18} /> },
    { title: "Intelligent Conversations", icon: <MessageSquare size={18} /> },
    { title: "Markdown Responses", icon: <FileText size={18} /> },
    { title: "Saved Chat History", icon: <History size={18} /> },
    { title: "Secure Authentication", icon: <ShieldCheck size={18} /> },
    { title: "Fast & Responsive", icon: <Zap size={18} /> },
  ];

  return (
    <section className="features-section centered-section">
      <div className="features-container">
        <div className="section-header minimal-header">
          <h2 className="section-title">Everything you need.</h2>
          <p className="section-subtitle">
            A powerful, intuitive AI assistant built for speed and accuracy.
          </p>
        </div>

        <div className="compact-features-grid">
          {featuresList.map((feature, index) => (
            <div key={index} className="compact-feature-card">
              <div className="compact-icon">{feature.icon}</div>
              <span className="compact-title">{feature.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
