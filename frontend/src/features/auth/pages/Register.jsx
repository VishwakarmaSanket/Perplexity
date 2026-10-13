import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";
import { setError } from "../auth.slice.js";
import "../styles/login.scss";
import "../styles/register.scss";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const success = await handleRegister({
      username,
      email,
      password,
    });

    if (success) {
      setSuccessMsg("Account created successfully.");
      setUsername("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  };

  return (
    <main className="login-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand" aria-label="Perplexity home">
          <img src="/assets/AI_Logo.png" alt="" />
          <span>perplexity</span>
        </Link>

        <div className="login-topbar">
          <span>Already have an account?</span>
          <Link to="/login" className="topbar-link">
            Sign in <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="login-main">
        <div className="login-form-container">
          <div className="form-heading">
            <h1>Create your account</h1>
            <p>
              Start exploring ideas, finding answers, and learning something
              new.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="error-indicator">!</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="register-success" role="status">
              <span className="success-indicator">
                <CheckIcon />
              </span>
              <span>{successMsg}</span>

              <button
                type="button"
                className="success-login-link"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </div>
          )}

          <form onSubmit={submitForm} className="login-form">
            <div className="login-field">
              <label htmlFor="register-username">Username</label>
              <input
                id="register-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
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
              <label htmlFor="register-password">Password</label>

              <div className="password-input">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="login-register">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <footer className="login-bottom">Curiosity has no limits.</footer>
      </section>
    </main>
  );
};

function CheckIcon() {
  return <span aria-hidden="true">✓</span>;
}

export default Register;
