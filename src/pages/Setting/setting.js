import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "../../App";
import { FaUser, FaCode } from "react-icons/fa";
import "./setting.css";

const Setting = () => {
  const context = useContext(MyContext);
  const contentRef = useRef(null);

  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSection]);

  const settingsSections = [
    {
      id: "profile",
      title: "Profile Settings",
      icon: <FaUser />,
      description: "Manage your profile information and preferences",
    },
    {
      id: "api-management",
      title: "API Management",
      icon: <FaCode />,
      description: "Manage API keys and endpoints",
    },
  ];

  const handleProfileClick = () => {
    setActiveSection("profile");
  };

  const handleManageKeys = () => {
    alert("Opening API Keys manager...");
  };

  const handleViewAnalytics = () => {
    alert("Navigating to analytics dashboard...");
  };

  const handleViewDocs = () => {
    window.open("https://example.com/docs", "_blank");
  };

  const renderProfileSection = () => (
    <div className="profile-section fade-in">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <p>Manage your account details and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            <FaUser />
          </div>
          <button className="change-avatar-btn hover-lift">Change Avatar</button>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              defaultValue={context.username || ""}
              className="focus-ring"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              defaultValue={context.userEmail || ""}
              readOnly
              className="focus-ring"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              placeholder="Your role in the organization"
              defaultValue="Developer"
              className="focus-ring"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              rows="4"
              className="focus-ring"
            ></textarea>
          </div>

          <div className="form-actions">
            <button className="save-btn hover-lift">Save Changes</button>
            <button className="cancel-btn hover-lift">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiManagementSection = () => (
    <div className="api-management-section fade-in">
      <h2>Chatbot API Management</h2>
      <p className="section-description">
        Manage your chatbot API keys, models, and conversation settings
      </p>

      <div className="settings-group">
        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>Chatbot API Keys</h3>
            <p>Manage API keys for chatbot services (OpenAI, Claude, etc.)</p>
          </div>
          <button className="manage-btn hover-lift" onClick={handleManageKeys}>
            Manage Keys
          </button>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>AI Model Selection</h3>
            <p>Choose your preferred AI model for chatbot responses</p>
          </div>
          <select className="setting-control focus-ring" defaultValue="GPT-4">
            <option>GPT-4</option>
            <option>GPT-3.5 Turbo</option>
            <option>Claude-3</option>
            <option>Claude-2</option>
            <option>Custom Model</option>
          </select>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>Conversation Memory</h3>
            <p>Enable conversation history and context retention</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>Response Length</h3>
            <p>Set maximum response length for chatbot</p>
          </div>
          <select className="setting-control focus-ring" defaultValue="Medium (200-500 words)">
            <option>Short (100-200 words)</option>
            <option>Medium (200-500 words)</option>
            <option>Long (500+ words)</option>
            <option>Custom</option>
          </select>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>Temperature Settings</h3>
            <p>Control creativity vs consistency in responses</p>
          </div>
          <select className="setting-control focus-ring" defaultValue="Balanced (0.5)">
            <option>Conservative (0.1)</option>
            <option>Balanced (0.5)</option>
            <option>Creative (0.9)</option>
            <option>Custom</option>
          </select>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>Chatbot Analytics</h3>
            <p>View conversation analytics and performance metrics</p>
          </div>
          <button className="analytics-btn hover-lift" onClick={handleViewAnalytics}>
            View Analytics
          </button>
        </div>

        <div className="setting-item hover-lift">
          <div className="setting-info">
            <h3>API Documentation</h3>
            <p>Access chatbot API documentation and integration guides</p>
          </div>
          <button className="docs-btn hover-lift" onClick={handleViewDocs}>
            View Docs
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "api-management":
        return renderApiManagementSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <div className="sidebar-menu">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                className={`menu-item ${activeSection === section.id ? "active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="menu-icon">{section.icon}</span>
                <div className="menu-content">
                  <span className="menu-title">{section.title}</span>
                  <span className="menu-description">{section.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-content" ref={contentRef}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Setting;
