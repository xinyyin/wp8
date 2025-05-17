// web-ui/src/App.tsx
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'; // Removed useNavigate from here as it's used in components
import './App.css';
import Splash from './components/Splash/Splash';
import Profile from './components/Profile/Profile';
import Login from './components/Login/Login';
import RoomComponent from './components/Room/Room';
import { User } from './types'; // Make sure types.ts exists and is correctly imported

export const API_BASE_URL = 'http://localhost:5050/api';
 // Ensure this matches your Flask port

// Define the type for the context passed via Outlet
export interface AppOutletContextType {
    currentUser: User | null;
    apiKey: string | null;
    username: string | null;
    userId: string | null;
    handleLogout: () => void;
    API_BASE_URL: string;
    intendedPath: string | null;
    setIntendedPath: React.Dispatch<React.SetStateAction<string | null>>;
    updateGlobalUsername: (newName: string) => void; // For Profile to update App's state
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('apiKey'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Renamed for clarity
  const [intendedPath, setIntendedPath] = useState<string | null>(null);

  const updateCurrentUserState = useCallback((name: string | null, id: string | null, key: string | null) => {
    if (name && id && key) {
        setCurrentUser({ id: parseInt(id, 10), name: name, api_key: key });
        setUsername(name);
        setUserId(id);
        setApiKey(key);
    } else {
        setCurrentUser(null);
        setUsername(null);
        setUserId(null);
        setApiKey(null);
    }
  }, []); // Empty dependency array as it doesn't depend on App's scope variables directly

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');
    if (storedApiKey && storedUsername && storedUserId) {
      updateCurrentUserState(storedUsername, storedUserId, storedApiKey);
    }
    setIsLoadingAuth(false);
  }, [updateCurrentUserState]); // updateCurrentUserState is now stable due to useCallback

  const handleLogin = (userFromApi: { user_name: string, user_id: number }, key: string) => { // Match ApiKeyResponse structure
    localStorage.setItem('apiKey', key);
    localStorage.setItem('username', userFromApi.user_name);
    localStorage.setItem('userId', userFromApi.user_id.toString());
    updateCurrentUserState(userFromApi.user_name, userFromApi.user_id.toString(), key);
  };

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    updateCurrentUserState(null, null, null);
    setIntendedPath(null); // Clear any stored intended path
    // Navigation to /login will be handled by ProtectedRoute or Navigate component
  };

  const updateGlobalUsername = (newName: string) => {
    localStorage.setItem('username', newName);
    setUsername(newName); // Update username state in App
    if(currentUser && apiKey && userId) { // Ensure other parts of currentUser are preserved
        setCurrentUser({id: parseInt(userId), name: newName, api_key: apiKey});
    }
  };

  const outletContextValue: AppOutletContextType = {
    currentUser, apiKey, username, userId, handleLogout,
    API_BASE_URL, intendedPath, setIntendedPath, updateGlobalUsername
  };

  const ProtectedRoute = () => {
    const location = useLocation();
    // const context = useOutletContext<AppOutletContextType>(); // Not strictly needed for setIntendedPath if it's from App's scope

    useEffect(() => {
      // This is the CORRECT place for this side-effect
      if (!apiKey && location.pathname !== "/login") {
          setIntendedPath(location.pathname + location.search + location.hash);
      }
  }, [apiKey, location, /*setIntendedPath*/]); 

    if (isLoadingAuth) {
      return <div>Loading authentication...</div>;
    }

    if (!apiKey) { 
      return <Navigate to="/login" replace />;
    }
    return <Outlet context={outletContextValue} />;
  };

  const LoginPageWrapper = () => {
    if (isLoadingAuth) return <div>Loading...</div>; 
    if (apiKey && currentUser) { 
        const redirectTo = intendedPath || '/';
        return <Navigate to={redirectTo} replace />;
    }
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} intendedPath={intendedPath} setIntendedPath={setIntendedPath} />;
  };

  if (isLoadingAuth) {
    return <div>Application is loading...</div>; 
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Splash />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/room/:roomId" element={<RoomComponent />} />
          {/* Fallback for unknown protected routes, redirect to splash */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* General fallback if not authenticated and not on login (e.g. direct invalid URL) */}
         {!apiKey && <Route path="*" element={<Navigate to="/login" replace />} />}
      </Routes>
    </Router>
  );
}

export default App;