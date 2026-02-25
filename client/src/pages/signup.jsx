import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      // Submit form - API call would go here
      console.log('Form submitted:', formData);
      // Redirect to dashboard or show success message
      alert('Sign up successful! Please check your email to verify your account.');
    } else {
      setErrors(newErrors);
    }
  };

  const handleSocialSignup = (provider) => {
    console.log(`Sign up with ${provider}`);
    // Implement social signup logic here
  };

  return (
    <div className="auth-container">
      {/* Background with gradient */}
      <div className="auth-background">
        <div className="auth-overlay"></div>
      </div>

      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-brand">
          <Link to="/" className="brand-logo">
            <i className="fas fa-microphone-alt"></i>
            <span>SpeakSense AI</span>
          </Link>
          <h1>Start your journey to interview mastery</h1>
          <p>Join thousands of professionals who've improved their interview skills with AI-powered feedback.</p>
          
          <div className="brand-features">
            <div className="brand-feature">
              <i className="fas fa-robot"></i>
              <div>
                <h4>AI-Powered Interviews</h4>
                <p>Practice with our advanced AI interviewer</p>
              </div>
            </div>
            <div className="brand-feature">
              <i className="fas fa-chart-line"></i>
              <div>
                <h4>Instant Feedback</h4>
                <p>Get real-time analysis of your responses</p>
              </div>
            </div>
            <div className="brand-feature">
              <i className="fas fa-video"></i>
              <div>
                <h4>Video Recordings</h4>
                <p>Review your sessions and track progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p>Start your free 14-day trial</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                <i className="fas fa-user"></i>
                Full Name
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

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email Address
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

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
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
                Must be at least 8 characters with uppercase, lowercase & number
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock"></i>
                Confirm Password
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
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

            {/* Terms Agreement */}
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
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn">
              <i className="fas fa-user-plus"></i>
              Sign Up
            </button>

            {/* Social Signup */}
            <div className="auth-divider">
              <span>or sign up with</span>
            </div>

            <div className="social-auth">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleSocialSignup('google')}
              >
                <i className="fab fa-google"></i>
                Google
              </button>
              <button
                type="button"
                className="social-btn github"
                onClick={() => handleSocialSignup('github')}
              >
                <i className="fab fa-github"></i>
                GitHub
              </button>
              <button
                type="button"
                className="social-btn linkedin"
                onClick={() => handleSocialSignup('linkedin')}
              >
                <i className="fab fa-linkedin"></i>
                LinkedIn
              </button>
            </div>

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

export default SignUp;