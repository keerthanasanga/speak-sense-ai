import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    experience: '',
    password: '',
    confirmPassword: '',
    interests: [],
    agreeTerms: false,
    newsletter: false
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const experienceLevels = [
    'Student',
    'Entry Level (0-2 years)',
    'Mid Level (3-5 years)',
    'Senior (6-10 years)',
    'Lead/Manager (10+ years)'
  ];

  const interestOptions = [
    'Technical Interviews',
    'Behavioral Interviews',
    'Management Interviews',
    'Case Study Interviews',
    'Salary Negotiation',
    'Mock Presentations'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'interests') {
      const updatedInterests = checked
        ? [...formData.interests, value]
        : formData.interests.filter(interest => interest !== value);
      
      setFormData({
        ...formData,
        interests: updatedInterests
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length === 0) {
      setStep(2);
    } else {
      setErrors(stepErrors);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stepErrors = validateStep2();
    
    if (Object.keys(stepErrors).length === 0) {
      // Submit form - API call would go here
      console.log('Registration submitted:', formData);
      alert('Registration successful! Please check your email to verify your account.');
      // Redirect to dashboard
    } else {
      setErrors(stepErrors);
    }
  };

  const handleSocialRegister = (provider) => {
    console.log(`Register with ${provider}`);
    // Implement social registration logic
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>

      <div className="auth-wrapper register-wrapper">
        {/* Progress Bar */}
        <div className="registration-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Basic Info</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Account Setup</span>
          </div>
        </div>

        <div className="auth-form-container register-form">
          <div className="auth-form-header">
            <h2>Register for SpeakSense AI</h2>
            <p>Create your account and start practicing</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="fullName">
                    <i className="fas fa-user"></i>
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <i className="fas fa-envelope"></i>
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <i className="fas fa-phone"></i>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="company">
                      <i className="fas fa-building"></i>
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      placeholder="Your company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group half">
                    <label htmlFor="jobTitle">
                      <i className="fas fa-briefcase"></i>
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      placeholder="Your role"
                      value={formData.jobTitle}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="experience">
                    <i className="fas fa-chart-line"></i>
                    Experience Level
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <button type="button" className="auth-submit-btn" onClick={handleNext}>
                  Next Step <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}

            {/* Step 2: Account Setup */}
            {step === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="password">
                    <i className="fas fa-lock"></i>
                    Password <span className="required">*</span>
                  </label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  <div className="password-hint">
                    Use at least 8 characters with uppercase, lowercase & number
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <i className="fas fa-lock"></i>
                    Confirm Password <span className="required">*</span>
                  </label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-tasks"></i>
                    Areas of Interest <span className="required">*</span>
                  </label>
                  <div className="interests-grid">
                    {interestOptions.map(interest => (
                      <label key={interest} className="checkbox-label interest-item">
                        <input
                          type="checkbox"
                          name="interests"
                          value={interest}
                          checked={formData.interests.includes(interest)}
                          onChange={handleChange}
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                  {errors.interests && <span className="error-message">{errors.interests}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">
                      I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
                      <Link to="/privacy">Privacy Policy</Link> <span className="required">*</span>
                    </span>
                  </label>
                  {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">
                      Send me interview tips and product updates
                    </span>
                  </label>
                </div>

                <div className="form-navigation">
                  <button type="button" className="btn-outline" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button type="submit" className="auth-submit-btn">
                    Complete Registration <i className="fas fa-check"></i>
                  </button>
                </div>

                {/* Social Registration */}
                <div className="auth-divider">
                  <span>or register with</span>
                </div>

                <div className="social-auth">
                  <button
                    type="button"
                    className="social-btn google"
                    onClick={() => handleSocialRegister('google')}
                  >
                    <i className="fab fa-google"></i>
                    Google
                  </button>
                  <button
                    type="button"
                    className="social-btn linkedin"
                    onClick={() => handleSocialRegister('linkedin')}
                  >
                    <i className="fab fa-linkedin"></i>
                    LinkedIn
                  </button>
                </div>
              </div>
            )}

            {/* Login Link */}
            <div className="auth-redirect">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;