// web-ui/src/components/Login/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ApiKeyResponse } from '../../types';
import './Login.css'; // Create this CSS file

interface LoginProps {
  onLogin: (userFromApi: { user_name: string, user_id: number }, apiKey: string) => void;
  apiBaseUrl: string;
  intendedPath: string | null;
  setIntendedPath: (path: string | null) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, apiBaseUrl, intendedPath, setIntendedPath }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data: ApiKeyResponse = await response.json();
      if (response.ok && data.success && data.api_key) {
        const user: User = { id: data.user_id, name: data.user_name, api_key: data.api_key };
        onLogin({ user_name: data.user_name, user_id: data.user_id }, data.api_key);
        const redirectTo = intendedPath || '/';
        setIntendedPath(null); // Clear intended path
        navigate(redirectTo, { replace: true });
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    }
  };

  const handleSignup = async () => {
    setError(null);
    try {
        const response = await fetch(`${apiBaseUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data: ApiKeyResponse = await response.json();
        if (response.ok && data.success && data.api_key) {
            const user: User = { id: data.user_id, name: data.user_name, api_key: data.api_key };
            onLogin({ user_name: data.user_name, user_id: data.user_id }, data.api_key);
            const redirectTo = intendedPath || '/';
            setIntendedPath(null); // Clear intended path
            navigate(redirectTo, { replace: true });
        } else {
            setError(data.message || 'Signup failed.');
        }
    } catch (err) {
        setError('An error occurred during signup. Please try again.');
        console.error('Signup error:', err);
    }
  };


  return (
    <div className="login-container"> {/* Use classes from your old style.css or new ones */}
      <div className="header">
        <h2>Watch Party</h2>
        <h4>4</h4>
      </div>
      <div className="clip">
        <div className="auth container">
          <h3>Enter your username and password to log in:</h3>
          <form onSubmit={handleLoginSubmit} className="alignedForm login">
            <label htmlFor="login_username">Username</label>
            <input
              id="login_username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            <label htmlFor="login_password">Password</label>
            <input
              id="login_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </form>
          {error && <div className="failed-message">{error}</div>}
          <div className="signup-section">
            <p>Don't have an account?</p>
            <button onClick={handleSignup} className="create-account-button">
              Create a new Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;