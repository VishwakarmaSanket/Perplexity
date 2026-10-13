import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import { useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";
import "../styles/login.scss";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const submitForm = async (event) => {
    event.preventDefault();

    const success = await handleLogin({ email, password });

    if (success) {
      navigate("/");
    }
  };

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand" aria-label="Perplexity home">
          <img src="/assets/AI_Logo.png" alt="" />
          <span>perplexity</span>
        </Link>

        <div className="login-topbar">
          <span>New here?</span>
          <Link to="/register" className="topbar-link">
            Create account <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="login-main">
        <div className="login-form-container">
          <div className="form-heading">
            <h1>Welcome back</h1>
            <p>Sign in to continue exploring your ideas and discoveries.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="error-indicator">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submitForm} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="password-input">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="login-register">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>

        <footer className="login-bottom">Curiosity has no limits.</footer>
      </section>
    </main>
  );
};

export default Login;
