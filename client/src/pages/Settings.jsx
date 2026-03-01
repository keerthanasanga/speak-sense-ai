import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Settings.css";

const defaultProfile = {
  fullName: "John Doe",
  email: "john.doe@example.com",
  username: "johndoe",
  bio: "Full Stack Developer passionate about AI and machine learning. Currently preparing for tech interviews.",
  location: "San Francisco, CA",
  website: "https://johndoe.dev",
  github: "johndoe",
  linkedin: "john-doe",
  twitter: "@johndoe",
  profilePicture: "👨‍💻",
  jobTitle: "Senior Software Engineer",
  company: "Tech Corp",
  experience: "8 years",
  education: "M.S. Computer Science",
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // User Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!storedUser) return defaultProfile;

      return {
        ...defaultProfile,
        fullName: storedUser.name || defaultProfile.fullName,
        email: storedUser.email || defaultProfile.email,
        experience: storedUser.experience || defaultProfile.experience,
      };
    } catch {
      return defaultProfile;
    }
  });

  // Account Settings State
  const [account, setAccount] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorAuth: true,
    sessionTimeout: "30",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    autoSave: true,
  });

  // Appearance Settings State
  const [appearance, setAppearance] = useState({
    theme: "dark",
    fontSize: "medium",
    compactMode: false,
    showAvatars: true,
    animations: true,
    codeEditorTheme: "monokai",
    fontFamily: "inter",
    borderRadius: "medium",
  });

  // Privacy Settings State
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: "private",
    showActivity: "connections",
    allowMessages: "connections",
    showOnlineStatus: true,
    searchEngineIndexing: false,
    dataSharing: false,
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailDigest: "daily",
    mentions: true,
    comments: true,
    friendRequests: true,
    interviewReminders: true,
    courseUpdates: true,
    achievementAlerts: true,
    weeklyProgress: true,
  });

  // Billing State
  const [billing, setBilling] = useState({
    plan: "pro",
    subscription: "annual",
    nextBilling: "2024-12-31",
    paymentMethod: {
      type: "visa",
      last4: "4242",
      expiry: "12/25",
    },
    invoices: [
      { id: "INV-001", date: "2024-01-01", amount: "$299.00", status: "paid" },
      { id: "INV-002", date: "2024-02-01", amount: "$299.00", status: "paid" },
      { id: "INV-003", date: "2024-03-01", amount: "$299.00", status: "paid" },
    ],
  });

  // Password State
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.new.length >= 8) strength += 25;
    if (password.new.match(/[a-z]+/)) strength += 25;
    if (password.new.match(/[A-Z]+/)) strength += 25;
    if (password.new.match(/[0-9]+/) || password.new.match(/[$@#&!]+/)) strength += 25;
    setPasswordStrength(strength);
  }, [password.new]);

  // Simulate save
  const handleSave = () => {
    setIsLoading(true);
    setSaveSuccess(false);
    
    setTimeout(() => {
      try {
        const existingUser = JSON.parse(localStorage.getItem("user") || "null") || {};
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...existingUser,
            name: profile.fullName,
            email: profile.email,
            experience: profile.experience,
          })
        );
      } catch {
        // ignore localStorage failures
      }

      setIsLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  // Tabs configuration
  const tabs = [
    { id: "profile", name: "Profile", icon: "👤" },
    { id: "account", name: "Account", icon: "🔐" },
    { id: "appearance", name: "Appearance", icon: "🎨" },
    { id: "notifications", name: "Notifications", icon: "🔔" },
    { id: "privacy", name: "Privacy", icon: "🛡️" },
    { id: "billing", name: "Billing", icon: "💳" },
    { id: "security", name: "Security", icon: "🔒" },
  ];

  // Languages
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
  ];

  // Timezones
  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  // Font sizes
  const fontSizes = [
    { id: "small", name: "Small" },
    { id: "medium", name: "Medium" },
    { id: "large", name: "Large" },
  ];

  // Code editor themes
  const editorThemes = [
    { id: "monokai", name: "Monokai" },
    { id: "dracula", name: "Dracula" },
    { id: "github", name: "GitHub" },
    { id: "solarized", name: "Solarized" },
    { id: "vs-code", name: "VS Code" },
  ];

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return "#ff4444";
    if (passwordStrength <= 50) return "#ffbb33";
    if (passwordStrength <= 75) return "#ffde03";
    return "#00C851";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  return (
    <div className="settings-page">
      {/* Background Elements */}
      <div className="settings-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="header-left">
            <Link to="/dashboard" className="back-to-dashboard">
              <span className="back-icon">←</span>
              Back to Dashboard
            </Link>
            <h1>
              <span className="header-icon">⚙️</span>
              Settings
            </h1>
          </div>
          <div className="header-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
            {saveSuccess && (
              <div className="save-success">
                <span>✅</span>
                Changes saved successfully!
              </div>
            )}
          </div>
        </div>

        {/* Settings Layout */}
        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <div className="settings-profile-summary">
              <div className="settings-profile-avatar">
                <span className="avatar-emoji">{profile.profilePicture}</span>
              </div>
              <div className="settings-profile-info">
                <h3>{profile.fullName}</h3>
                <p>{profile.email}</p>
                <span className="settings-plan-badge">
                  {billing.plan === "pro" ? "PRO Plan" : "Free Plan"}
                </span>
              </div>
            </div>

            <nav className="settings-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-nav-icon">{tab.icon}</span>
                  <span className="settings-nav-name">{tab.name}</span>
                  {tab.id === "billing" && (
                    <span className="settings-nav-badge">Pro</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="settings-sidebar-footer">
              <button className="settings-danger-btn">
                <span>⚠️</span>
                Delete Account
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="settings-content">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="settings-section">
                <h2>Profile Settings</h2>
                
                <div className="profile-picture-section">
                  <div className="picture-preview">
                    <span className="preview-emoji">{profile.profilePicture}</span>
                  </div>
                  <div className="picture-actions">
                    <button className="secondary-btn">Change Photo</button>
                    <button className="text-btn">Remove</button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-prefix">
                      <span>@</span>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({...profile, username: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      type="text"
                      value={profile.jobTitle}
                      onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({...profile, company: e.target.value})}
                      placeholder="Company name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      placeholder="https://"
                    />
                  </div>

                  <div className="form-group">
                    <label>GitHub</label>
                    <input
                      type="text"
                      value={profile.github}
                      onChange={(e) => setProfile({...profile, github: e.target.value})}
                      placeholder="username"
                    />
                  </div>

                  <div className="form-group">
                    <label>LinkedIn</label>
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                      placeholder="profile-url"
                    />
                  </div>

                  <div className="form-group">
                    <label>Twitter</label>
                    <input
                      type="text"
                      value={profile.twitter}
                      onChange={(e) => setProfile({...profile, twitter: e.target.value})}
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="form-divider"></div>

                <h3>Professional Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="text"
                      value={profile.experience}
                      onChange={(e) => setProfile({...profile, experience: e.target.value})}
                      placeholder="e.g. 5 years"
                    />
                  </div>

                  <div className="form-group">
                    <label>Education</label>
                    <input
                      type="text"
                      value={profile.education}
                      onChange={(e) => setProfile({...profile, education: e.target.value})}
                      placeholder="Degree, University"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === "account" && (
              <div className="settings-section">
                <h2>Account Settings</h2>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                  <span className="input-hint">We'll never share your email</span>
                </div>

                <div className="form-divider"></div>

                <h3>Preferences</h3>
                
                <div className="settings-grid">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">📧</span>
                      <div>
                        <h4>Email Notifications</h4>
                        <p>Receive updates via email</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={account.emailNotifications}
                        onChange={(e) => setAccount({...account, emailNotifications: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">📱</span>
                      <div>
                        <h4>Push Notifications</h4>
                        <p>Receive push notifications</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={account.pushNotifications}
                        onChange={(e) => setAccount({...account, pushNotifications: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">📊</span>
                      <div>
                        <h4>Marketing Emails</h4>
                        <p>Receive promotional emails</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={account.marketingEmails}
                        onChange={(e) => setAccount({...account, marketingEmails: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">🔐</span>
                      <div>
                        <h4>Two-Factor Authentication</h4>
                        <p>Enhanced security</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={account.twoFactorAuth}
                        onChange={(e) => setAccount({...account, twoFactorAuth: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-divider"></div>

                <h3>Regional Settings</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      value={account.language}
                      onChange={(e) => setAccount({...account, language: e.target.value})}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      value={account.timezone}
                      onChange={(e) => setAccount({...account, timezone: e.target.value})}
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date Format</label>
                    <select
                      value={account.dateFormat}
                      onChange={(e) => setAccount({...account, dateFormat: e.target.value})}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={account.sessionTimeout}
                      onChange={(e) => setAccount({...account, sessionTimeout: e.target.value})}
                      min="5"
                      max="120"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={account.autoSave}
                      onChange={(e) => setAccount({...account, autoSave: e.target.checked})}
                    />
                    <span>Auto-save my work every 5 minutes</span>
                  </label>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="settings-section">
                <h2>Appearance Settings</h2>

                <div className="theme-preview">
                  <div className="theme-option active">
                    <div className="theme-colors">
                      <span style={{ background: "#0a1928" }}></span>
                      <span style={{ background: "#0a1a2f" }}></span>
                      <span style={{ background: "#0066cc" }}></span>
                    </div>
                    <span>Dark (Default)</span>
                  </div>
                  <div className="theme-option">
                    <div className="theme-colors">
                      <span style={{ background: "#ffffff" }}></span>
                      <span style={{ background: "#f0f0f0" }}></span>
                      <span style={{ background: "#0066cc" }}></span>
                    </div>
                    <span>Light</span>
                  </div>
                  <div className="theme-option">
                    <div className="theme-colors">
                      <span style={{ background: "#1a1a2e" }}></span>
                      <span style={{ background: "#16213e" }}></span>
                      <span style={{ background: "#0f3460" }}></span>
                    </div>
                    <span>Navy</span>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Font Size</label>
                    <select
                      value={appearance.fontSize}
                      onChange={(e) => setAppearance({...appearance, fontSize: e.target.value})}
                    >
                      {fontSizes.map(size => (
                        <option key={size.id} value={size.id}>{size.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Font Family</label>
                    <select
                      value={appearance.fontFamily}
                      onChange={(e) => setAppearance({...appearance, fontFamily: e.target.value})}
                    >
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="opensans">Open Sans</option>
                      <option value="poppins">Poppins</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Code Editor Theme</label>
                    <select
                      value={appearance.codeEditorTheme}
                      onChange={(e) => setAppearance({...appearance, codeEditorTheme: e.target.value})}
                    >
                      {editorThemes.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Border Radius</label>
                    <select
                      value={appearance.borderRadius}
                      onChange={(e) => setAppearance({...appearance, borderRadius: e.target.value})}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>

                <div className="settings-grid">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">📦</span>
                      <div>
                        <h4>Compact Mode</h4>
                        <p>Show more content per page</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearance.compactMode}
                        onChange={(e) => setAppearance({...appearance, compactMode: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">🖼️</span>
                      <div>
                        <h4>Show Avatars</h4>
                        <p>Display user avatars</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearance.showAvatars}
                        onChange={(e) => setAppearance({...appearance, showAvatars: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">✨</span>
                      <div>
                        <h4>Animations</h4>
                        <p>Enable UI animations</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={appearance.animations}
                        onChange={(e) => setAppearance({...appearance, animations: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="settings-section">
                <h2>Notification Settings</h2>

                <div className="notification-section">
                  <h3>Email Digest</h3>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="emailDigest"
                        value="daily"
                        checked={notifications.emailDigest === "daily"}
                        onChange={(e) => setNotifications({...notifications, emailDigest: e.target.value})}
                      />
                      <span>Daily</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="emailDigest"
                        value="weekly"
                        checked={notifications.emailDigest === "weekly"}
                        onChange={(e) => setNotifications({...notifications, emailDigest: e.target.value})}
                      />
                      <span>Weekly</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="emailDigest"
                        value="never"
                        checked={notifications.emailDigest === "never"}
                        onChange={(e) => setNotifications({...notifications, emailDigest: e.target.value})}
                      />
                      <span>Never</span>
                    </label>
                  </div>
                </div>

                <div className="settings-grid">
                  {Object.entries({
                    mentions: { icon: "📢", label: "Mentions", desc: "When someone mentions you" },
                    comments: { icon: "💬", label: "Comments", desc: "Replies to your comments" },
                    friendRequests: { icon: "👥", label: "Friend Requests", desc: "New connection requests" },
                    interviewReminders: { icon: "🎯", label: "Interview Reminders", desc: "Upcoming interview alerts" },
                    courseUpdates: { icon: "📚", label: "Course Updates", desc: "New content in your courses" },
                    achievementAlerts: { icon: "🏆", label: "Achievements", desc: "When you earn badges" },
                    weeklyProgress: { icon: "📊", label: "Weekly Progress", desc: "Your learning summary" },
                  }).map(([key, value]) => (
                    <div key={key} className="setting-item">
                      <div className="setting-info">
                        <span className="setting-icon">{value.icon}</span>
                        <div>
                          <h4>{value.label}</h4>
                          <p>{value.desc}</p>
                        </div>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={notifications[key]}
                          onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <div className="settings-section">
                <h2>Privacy Settings</h2>

                <div className="form-group">
                  <label>Profile Visibility</label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                  >
                    <option value="public">Public - Everyone can see</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private - Only me</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Email Visibility</label>
                  <select
                    value={privacy.showEmail}
                    onChange={(e) => setPrivacy({...privacy, showEmail: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Activity Status</label>
                  <select
                    value={privacy.showActivity}
                    onChange={(e) => setPrivacy({...privacy, showActivity: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Who can message you?</label>
                  <select
                    value={privacy.allowMessages}
                    onChange={(e) => setPrivacy({...privacy, allowMessages: e.target.value})}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="connections">Connections Only</option>
                    <option value="none">No one</option>
                  </select>
                </div>

                <div className="settings-grid">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">🟢</span>
                      <div>
                        <h4>Show Online Status</h4>
                        <p>Let others see when you're active</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacy.showOnlineStatus}
                        onChange={(e) => setPrivacy({...privacy, showOnlineStatus: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">🔍</span>
                      <div>
                        <h4>Search Engine Indexing</h4>
                        <p>Allow search engines to index your profile</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacy.searchEngineIndexing}
                        onChange={(e) => setPrivacy({...privacy, searchEngineIndexing: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-icon">📊</span>
                      <div>
                        <h4>Data Sharing</h4>
                        <p>Share anonymous usage data to improve the platform</p>
                      </div>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={privacy.dataSharing}
                        onChange={(e) => setPrivacy({...privacy, dataSharing: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="warning-box">
                  <span className="warning-icon">⚠️</span>
                  <div>
                    <h4>Data Export & Deletion</h4>
                    <p>You can request a copy of your data or delete your account permanently.</p>
                    <div className="warning-actions">
                      <button className="secondary-btn">Request Data Export</button>
                      <button className="settings-danger-btn">Delete Account</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === "billing" && (
              <div className="settings-section">
                <h2>Billing & Subscription</h2>

                <div className="current-plan">
                  <div className="plan-header">
                    <span className="plan-name">Current Plan: Pro Annual</span>
                    <span className="plan-price">$299/year</span>
                  </div>
                  <div className="plan-features">
                    <span>✓ Unlimited practice sessions</span>
                    <span>✓ AI feedback on all code</span>
                    <span>✓ Advanced analytics</span>
                    <span>✓ Priority support</span>
                  </div>
                  <div className="plan-actions">
                    <button className="primary-btn">Upgrade Plan</button>
                    <button className="secondary-btn">Cancel Subscription</button>
                  </div>
                </div>

                <div className="payment-method">
                  <h3>Payment Method</h3>
                  <div className="credit-card">
                    <span className="card-icon">{billing.paymentMethod.type === "visa" ? "💳" : "💳"}</span>
                    <div className="card-details">
                      <span>•••• •••• •••• {billing.paymentMethod.last4}</span>
                      <span>Expires {billing.paymentMethod.expiry}</span>
                    </div>
                    <button className="text-btn">Edit</button>
                  </div>
                </div>

                <div className="billing-history">
                  <h3>Billing History</h3>
                  <table className="invoices-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.invoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td>{invoice.id}</td>
                          <td>{invoice.date}</td>
                          <td>{invoice.amount}</td>
                          <td>
                            <span className="status-badge success">{invoice.status}</span>
                          </td>
                          <td>
                            <button className="text-btn">Download</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="settings-section">
                <h2>Security Settings</h2>

                <div className="password-section">
                  <h3>Change Password</h3>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={password.current}
                      onChange={(e) => setPassword({...password, current: e.target.value})}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={password.new}
                      onChange={(e) => setPassword({...password, new: e.target.value})}
                      placeholder="Enter new password"
                    />
                    {password.new && (
                      <div className="password-strength">
                        <div className="strength-bars">
                          {[1, 2, 3, 4].map((bar) => (
                            <div
                              key={bar}
                              className="strength-bar"
                              style={{
                                backgroundColor: bar * 25 <= passwordStrength 
                                  ? getPasswordStrengthColor() 
                                  : "#2a3a4a",
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ color: getPasswordStrengthColor() }}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={password.confirm}
                      onChange={(e) => setPassword({...password, confirm: e.target.value})}
                      placeholder="Confirm new password"
                    />
                    {password.confirm && password.new !== password.confirm && (
                      <span className="error-message">Passwords don't match</span>
                    )}
                  </div>

                  <button className="primary-btn">Update Password</button>
                </div>

                <div className="form-divider"></div>

                <h3>Active Sessions</h3>
                <div className="sessions-list">
                  <div className="session-item">
                    <span className="session-device">💻 Chrome on macOS - San Francisco, US</span>
                    <span className="session-status current">Current Session</span>
                  </div>
                  <div className="session-item">
                    <span className="session-device">📱 Safari on iPhone - New York, US</span>
                    <span className="session-time">2 hours ago</span>
                  </div>
                  <div className="session-item">
                    <span className="session-device">🖥️ Firefox on Windows - London, UK</span>
                    <span className="session-time">2 days ago</span>
                  </div>
                </div>

                <button className="secondary-btn">Sign Out All Devices</button>

                <div className="form-divider"></div>

                <h3>Two-Factor Authentication</h3>
                <div className="two-factor-section">
                  <div className="two-factor-info">
                    <span className="info-icon">🔐</span>
                    <div>
                      <h4>Add an extra layer of security</h4>
                      <p>Protect your account with 2FA using an authenticator app</p>
                    </div>
                  </div>
                  <button className="primary-btn">Enable 2FA</button>
                </div>

                <div className="form-divider"></div>

                <h3>API Keys</h3>
                <div className="api-keys">
                  <div className="api-key-item">
                    <div className="key-info">
                      <span className="key-name">Production API Key</span>
                      <span className="key-value">••••••••••••••••</span>
                    </div>
                    <button className="text-btn">Regenerate</button>
                  </div>
                  <div className="api-key-item">
                    <div className="key-info">
                      <span className="key-name">Development API Key</span>
                      <span className="key-value">••••••••••••••••</span>
                    </div>
                    <button className="text-btn">Regenerate</button>
                  </div>
                  <button className="secondary-btn">Generate New Key</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}