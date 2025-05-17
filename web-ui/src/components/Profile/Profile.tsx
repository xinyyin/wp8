// web-ui/src/components/Profile/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { User, ApiResponse } from '../../types';
import './Profile.css';

interface ProfileOutletContext {
    currentUser: User | null;
    apiKey: string | null;
    handleLogout: () => void;
    API_BASE_URL: string;
}

const Profile: React.FC = () => {
  const { currentUser, apiKey, handleLogout, API_BASE_URL } = useOutletContext<ProfileOutletContext>();
  const navigate = useNavigate();

  const [currentUsername, setCurrentUsernameState] = useState(currentUser?.name || '');
  const [newUsername, setNewUsername] = useState(currentUser?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setNewUsername(currentUser.name);
      setCurrentUsernameState(currentUser.name);
    } else if (!apiKey) {
        // Should be handled by ProtectedRoute, but as a fallback
        navigate('/login');
    }
  }, [currentUser, apiKey, navigate]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!newUsername.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (newUsername.trim() === currentUsername) {
      setMessage("Username is already set to this value.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/user/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey!,
        },
        body: JSON.stringify({ new_name: newUsername.trim() }),
      });
      const data: ApiResponse = await response.json();
      if (response.ok && data.success) {
        setMessage('Username updated successfully!');
        localStorage.setItem('username', newUsername.trim()); // Update local storage
         // Advise re-login for state update in App.tsx or implement context update
        setCurrentUsernameState(newUsername.trim()); // Update local state for immediate feedback
         // Ideally, App.tsx's currentUser state should be updated.
         // For now, this provides local feedback. A full refresh or re-login
         // would show the change globally via localStorage.
         // Or, trigger a callback to App.tsx to update its state.
      } else {
        setError(data.message || 'Failed to update username.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!newPassword) {
      setError('Password cannot be empty.');
      return;
    }
    if (newPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }
    if (newPassword !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/user/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey!,
        },
        body: JSON.stringify({ new_password: newPassword, confirm_password: repeatPassword }),
      });
      const data: ApiResponse = await response.json();
      if (response.ok && data.success) {
        setMessage('Password updated successfully!');
        setNewPassword('');
        setRepeatPassword('');
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  if (!currentUser) {
    return <p>Loading profile...</p>; // Or redirect if not caught by ProtectedRoute
  }

  return (
    <div className="profile-page-container">
        <div className="header">
            <h2><Link to="/">Watch Party</Link></h2>
            <h4>4</h4>
            <div className="loginHeader">
                <div className="loggedIn">
                    <span className="username-display">{currentUsername}</span>
                    {/* Placeholder for person icon if needed */}
                </div>
            </div>
        </div>
        <div className="clip">
            <div className="auth container profile-form-container">
                <h2>Welcome to Watch Party, {currentUsername}!</h2>
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleUpdateUsername} className="alignedForm profile-form">
                    <label htmlFor="update_username">Username:</label>
                    <input
                    id="update_username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <button type="submit">Update Username</button>
                </form>

                <form onSubmit={handleUpdatePassword} className="alignedForm profile-form">
                    <label htmlFor="update_password">New Password:</label>
                    <input
                    id="update_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="submit">Update Password</button>

                    <label htmlFor="repeat_password">Repeat Password:</label>
                    <input
                    id="repeat_password"
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                     <div></div> {/* Spacer for button alignment */}
                </form>

                <div className="profile-actions">
                    <button className="exit goToSplash" onClick={() => navigate('/')}>
                    Cool, let's go!
                    </button>
                    <button className="exit logout" onClick={() => {
                        handleLogout();
                        navigate('/login'); // Ensure navigation after logout
                    }}>
                    Log out
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;