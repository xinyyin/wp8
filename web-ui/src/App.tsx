// web-ui/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './App.css'; // Your global styles
import Splash from './components/Splash/Splash';
import Profile from './components/Profile/Profile';
import Login from './components/Login/Login';
import RoomComponent from './components/Room/Room'; // Renamed to avoid conflict
import { User } from './types';

const API_BASE_URL = 'http://localhost:5000/api'; // Flask API URL

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('apiKey'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [isLoading, setIsLoading] = useState(true);
  const [intendedPath, setIntendedPath] = useState<string | null>(null);


  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');
    if (storedApiKey && storedUsername && storedUserId) {
      setApiKey(storedApiKey);
      setUsername(storedUsername);
      setUserId(storedUserId);
      setCurrentUser({ id: parseInt(storedUserId, 10), name: storedUsername, api_key: storedApiKey });
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User, key: string) => {
    localStorage.setItem('apiKey', key);
    localStorage.setItem('username', user.name);
    localStorage.setItem('userId', user.id.toString());
    setApiKey(key);
    setUsername(user.name);
    setUserId(user.id.toString());
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setApiKey(null);
    setUsername(null);
    setUserId(null);
    setCurrentUser(null);
    // Navigate to login or home after logout
    // This will be handled by ProtectedRoute redirecting to /login
  };

  // This component will handle protected routes
  const ProtectedRoute = () => {
    const location = useLocation();
    if (isLoading) {
      return <div>Loading...</div>; // Or a proper loader
    }
    if (!apiKey) {
      // Store the current path to redirect after login
      setIntendedPath(location.pathname + location.search + location.hash);
      return <Navigate to="/login" replace />;
    }
    // If logged in, render the child route
    return <Outlet context={{ currentUser, apiKey, handleLogout, API_BASE_URL, intendedPath, setIntendedPath }} />;
  };

  // This component will handle the login page, redirecting if already logged in
  const LoginPageWrapper = () => {
    const navigate = useNavigate();
    if (apiKey) {
        // If there was an intended path, go there, otherwise to home
        const redirectTo = intendedPath || '/';
        setIntendedPath(null); // Clear intended path
        return <Navigate to={redirectTo} replace />;
    }
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} intendedPath={intendedPath} setIntendedPath={setIntendedPath} />;
  }


  if (isLoading) {
    return <div>Loading application...</div>; // Or a global spinner
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Splash />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/room/:roomId" element={<RoomComponent />} />
          {/* Add other protected routes here */}
        </Route>

        {/* Fallback for unknown routes - consider a 404 component */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;