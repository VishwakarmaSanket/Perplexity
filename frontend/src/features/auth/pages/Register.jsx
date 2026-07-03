import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { useSelector, useDispatch } from "react-redux";
import { setError } from "../auth.slice.js";
import { User, Mail, Lock } from "lucide-react";
import "../styles/register.scss";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { handleRegister } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const submitForm = async (event) => {
    event.preventDefault();
    setSuccessMsg("");
    dispatch(setError(null));

    const payload = {
      username,
      email,
      password,
    };

    const success = await handleRegister(payload);
    if (success) {
      setSuccessMsg(
        "Account created! You can now sign in.",
      );
      setUsername("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <section className="register-section animate-in fade-in">
      {/* Background blobs */}
      <div className="glow-container">
        <div className="glow-top-left animate-pulse" />
        <div className="glow-bottom-right" />
      </div>

      {/* Center Container */}
      <div className="register-center">
        {/* Card */}
        <div className="register-card">
          {/* Heading */}
          <div className="register-heading">
            <div className="register-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#10a37f" />
                <path d="M10 16h12M16 10v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1>Create account</h1>
          </div>
          <p className="register-subtitle">
            Join Perplexity and start exploring.
          </p>

          {error && (
            <div className="auth-alert auth-alert--error animate-in slide-in-from-bottom-4">
              <span>⚠️ {error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert--success animate-in slide-in-from-bottom-4">
              <span>✅ {successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submitForm} className="register-form">
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
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
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="register-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Register;
