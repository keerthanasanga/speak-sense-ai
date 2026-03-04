import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken, getStoredUser, clearAuthSession } from "../utils/authStorage";
import "./AdvancedNavbar.css";

export default function AdvancedNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const notifications = [
        { id: 1, text: "Your interview feedback is ready", icon: "📊", time: "5 min ago", unread: true },
        { id: 2, text: "New practice session available", icon: "🎯", time: "1 hour ago", unread: false },
        { id: 3, text: "You've completed 25 interviews!", icon: "🏆", time: "Yesterday", unread: false },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            const storedUser = getStoredUser();
            setUser(storedUser);
        } else {
            setUser(null);
        }
    }, [location]);

    const handleLogout = () => {
        clearAuthSession();
        setUser(null);
        setIsMobileMenuOpen(false);
        navigate("/");
    };

    const navLinks = user
        ? [
            { name: "Overview", path: "/dashboard", icon: "📊" },
            { name: "Interviews", path: "/planning", icon: "🎙️" },
            { name: "Practice", path: "/practice", icon: "🧠" },
            { name: "Resume", path: "/resume-analyzer", icon: "📋" },
            { name: "Questions", path: "/question-bank", icon: "❓" },
            { name: "Feedback", path: "/results", icon: "📝" },
            { name: "Settings", path: "/settings", icon: "⚙️" },
        ]
        : [
            { name: "Features", path: "/#features", icon: "⚡" },
            { name: "Success Stories", path: "/#testimonials", icon: "🌟" },
            { name: "Resources", path: "/#resources", icon: "📚" },
        ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <nav className={`advanced-navbar ${isScrolled ? "scrolled" : ""}`}>
            <div className="navbar-container">
                <Link to={user ? "/dashboard" : "/"} className="navbar-brand" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div
                        className="brand-logo"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                    >
                        🎙️
                    </motion.div>
                    <span className="brand-text">SpeakSense AI</span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-desktop-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                        >
                            <span className="link-icon">{link.icon}</span>
                            <span className="link-text">{link.name}</span>
                            {location.pathname === link.path && (
                                <motion.div className="active-indicator" layoutId="nav-active" />
                            )}
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    {user ? (
                        <div className="user-controls">
                            {/* Notifications */}
                            <div className="notifications-container">
                                <button
                                    className={`notification-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <span className="noti-btn-icon">🔔</span>
                                    {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            className="notifications-dropdown"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        >
                                            <div className="noti-header">
                                                <h4>Notifications</h4>
                                                <button className="mark-read-all">Mark all read</button>
                                            </div>
                                            <div className="noti-list">
                                                {notifications.map(noti => (
                                                    <div key={noti.id} className={`noti-item ${noti.unread ? "unread" : ""}`}>
                                                        <span className="noti-item-icon">{noti.icon}</span>
                                                        <div className="noti-item-content">
                                                            <p>{noti.text}</p>
                                                            <span className="noti-item-time">{noti.time}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link to="/profile" className="user-profile-btn">
                                <span className="user-avatar">{user.avatar || "👤"}</span>
                                <span className="user-name">{user.name?.split(" ")[0]}</span>
                            </Link>
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">Sign In</Link>
                            <Link to="/signup" className="btn-signup">Try Free</Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`mobile-toggle ${isMobileMenuOpen ? "open" : ""}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="mobile-menu-overlay"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="mobile-links">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`mobile-link ${location.pathname === link.path ? "active" : ""}`}
                                >
                                    <span className="link-icon">{link.icon}</span>
                                    <span className="link-text">{link.name}</span>
                                </Link>
                            ))}
                            <div className="mobile-divider"></div>
                            {user ? (
                                <>
                                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="mobile-link">
                                        <span className="link-icon">👤</span>
                                        <span className="link-text">Profile</span>
                                    </Link>
                                    <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
                                </>
                            ) : (
                                <div className="mobile-auth-btns">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="mobile-btn-login">Sign In</Link>
                                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="mobile-btn-signup">Try Free</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
