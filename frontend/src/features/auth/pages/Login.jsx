import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import { Mail, Lock } from "lucide-react";
import "../styles/login.scss";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Accessing user and loading state from Redux
  // So accordingly we can redirect if user is already logged in or show loading state
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const { handleLogin } = useAuth();

  const navigate = useNavigate();

  const submitForm = async (event) => {
    event.preventDefault();

    const payload = {
      email,
      password,
    };

    const success = await handleLogin(payload);
    // Only navigate on successful login
    if (success) {
      navigate("/");
    }
  };

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="login-section animate-in fade-in">
      {/* Background subtle blobs */}
      <div className="glow-container">
        <div className="glow-top-left animate-pulse" />
        <div className="glow-bottom-right animate-pulse" />
      </div>

      {/* Center Container */}
      <div className="login-center">
        {/* Card */}
        <div className="login-card">
          {/* Heading */}
          <div className="login-heading">
            <div className="login-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#10a37f" />
                <path d="M10 16h12M16 10v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1>Welcome back</h1>
          </div>
          <p className="login-subtitle">
            Sign in to continue to Perplexity.
          </p>

          {error && (
            <div className="auth-alert auth-alert--error animate-in slide-in-from-bottom-4">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submitForm} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label>Email address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <div className="btn-spinner-container">
                  <div className="btn-spinner" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
