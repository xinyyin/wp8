// web-ui/src/components/Splash/Splash.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Room, User } from '../../types';
import './Splash.css'; // Create this CSS file

interface SplashOutletContext {
    currentUser: User | null;
    apiKey: string | null;
    handleLogout: () => void;
    API_BASE_URL: string;
}

const Splash: React.FC = () => {
  const { currentUser, apiKey, handleLogout, API_BASE_URL } = useOutletContext<SplashOutletContext>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!apiKey) {
        // This should ideally be handled by ProtectedRoute, but as a safeguard:
        setIsLoadingRooms(false);
        return;
      }
      setIsLoadingRooms(true);
      try {
        const response = await fetch(`${API_BASE_URL}/rooms`, {
          headers: { 'Api-Key': apiKey },
        });
        if (response.ok) {
          const data: Room[] = await response.json();
          setRooms(data);
        } else {
          console.error('Failed to fetch rooms:', response.statusText);
          if (response.status === 401) handleLogout(); // Or redirect to login
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    if (apiKey) {
        fetchRooms();
    } else {
         setIsLoadingRooms(false); // Not logged in, no rooms to fetch
    }
  }, [apiKey, API_BASE_URL, handleLogout]);

  const handleCreateRoom = async () => {
    if (!apiKey) return;
    const roomName = prompt('Enter a name for the new room (optional):', '');
    if (roomName === null) return; // User cancelled

    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({ room_name: roomName.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.room) {
        setRooms(prevRooms => [...prevRooms, data.room]); // Optimistically add, or refetch
        navigate(`/room/${data.room.id}`);
      } else {
        alert(`Failed to create room: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert(`Error creating room: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="splash-container"> {/* Adapt from old .splash.container */}
      <div className="splashHeader">
        <div className="loginHeader">
          {currentUser && apiKey ? (
            <div className="loggedIn">
              <Link to="/profile" className="welcomeBack">
                <span className="username">Welcome back, {currentUser.name}!</span>
                <span className="material-symbols-outlined md-18">person</span> {/* Consider using a React icon library or SVG */}
              </Link>
              <button onClick={handleLogout} className="logout-button-splash">Logout</button>
            </div>
          ) : (
            <div className="loggedOut">
              <Link to="/login">Login</Link>
            </div>
          )}
        </div>
      </div>

      <div className="hero">
        <div className="logo">
          {/* Consider local images in public or src/assets */}
        </div>
        <h1>Watch Party</h1>
        <h2>4</h2>
        {apiKey && (
          <button className="create" onClick={handleCreateRoom}>
            Create a Room
          </button>
        )}
        {!apiKey && (
             <Link to="/login" className="login-button-hero">Login to Create Rooms</Link>
        )}
      </div>

      <h2>Rooms</h2>
      <div className="rooms">
        {isLoadingRooms ? (
          <p>Loading rooms...</p>
        ) : rooms.length > 0 ? (
          <div className="roomList">
            {rooms.map((room) => (
              <Link key={room.id} to={`/room/${room.id}`}>
                {room.id}: <strong>{room.name}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <div className="noRooms">
            {apiKey ? "No rooms yet! You get to be first!" : "Log in to see available rooms."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Splash;