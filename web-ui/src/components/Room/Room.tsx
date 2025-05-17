// web-ui/src/components/Room/Room.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Room, Message as MessageType, User, ApiResponse, PostMessageResponse, CreateRoomResponse } from '../../types';
import { AppOutletContextType } from '../../App'; // Assuming App.tsx exports this
import './Room.css';

const RoomComponent: React.FC = () => {
  const context = useOutletContext<AppOutletContextType>();
  // Destructure only what's needed, or all if preferred
  const { currentUser, apiKey, handleLogout, API_BASE_URL } = context;
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editableRoomName, setEditableRoomName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!apiKey || !roomId || isNaN(parseInt(roomId))) {
      setError(roomId && isNaN(parseInt(roomId)) ? "Invalid Room ID format." : "Room ID is missing or user not authenticated.");
      setIsLoading(false);
      if (!apiKey) navigate('/login');
      return;
    }

    const fetchRoomData = async () => {
      setIsLoading(true);
      setError(null);
      setRoomDetails(null); // Reset on room change
      setMessages([]);      // Reset on room change

      try {
        // Attempt to get specific room details first if such an endpoint exists
        // For now, we'll fetch all rooms to find the current one as per previous logic for Ex8.
        let foundRoom: Room | undefined = undefined;
        try {
          const roomsResponse = await fetch(`${API_BASE_URL}/rooms`, {
            headers: { 'Api-Key': apiKey },
          });
          if (roomsResponse.ok) {
            const allRooms: Room[] = await roomsResponse.json();
            foundRoom = allRooms.find(r => r.id.toString() === roomId);
            if (foundRoom) {
              setRoomDetails(foundRoom);
              setEditableRoomName(foundRoom.name);
            } else {
              setError(`Room with ID ${roomId} not found.`);
              setIsLoading(false);
              return; // Stop if room not found
            }
          } else {
            throw new Error(`Failed to fetch rooms list: ${roomsResponse.statusText}`);
          }
        } catch (e) {
          console.warn("Could not fetch all rooms to get current room name", e);
          setError(e instanceof Error ? e.message : "Error fetching room details.");
          setIsLoading(false);
          return; // Stop if fetching rooms failed
        }

        // If room was found, fetch its messages
        if (foundRoom) {
          const messagesResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
            headers: { 'Api-Key': apiKey },
          });
          if (messagesResponse.ok) {
            const messagesData: MessageType[] = await messagesResponse.json();
            setMessages(messagesData.map(msg => ({ ...msg, author: msg.author || "Unknown" })));
          } else {
            if (messagesResponse.status === 401) handleLogout();
            throw new Error(`Failed to fetch messages: ${messagesResponse.statusText}`);
          }
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading the room.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();

    // Cleanup polling interval on component unmount or when roomId/apiKey changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [roomId, apiKey, API_BASE_URL, handleLogout, navigate]); // navigate added if used in effect

  // Polling for new messages
  useEffect(() => {
    // Only start polling if data has loaded, we have an API key, and a valid room
    if (!apiKey || !roomId || isLoading || error || !roomDetails) {
        if (pollingIntervalRef.current) { // Clear existing interval if conditions not met
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        return;
    }

    const pollMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
          headers: { 'Api-Key': apiKey },
        });
        if (response.ok) {
          const newMessagesData: MessageType[] = await response.json();
          // More robust check: compare IDs or timestamps if available
          if (JSON.stringify(newMessagesData) !== JSON.stringify(messages)) {
            setMessages(newMessagesData.map(msg => ({ ...msg, author: msg.author || "Unknown" })));
          }
        } else if (response.status === 401) {
          handleLogout();
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        }
      } catch (pollError) {
        console.warn('Polling error:', pollError);
        // Optionally, stop polling on repeated errors or notify user
      }
    };

    pollingIntervalRef.current = window.setInterval(pollMessages, 500); // Rubric specified 0.5 seconds

    return () => { // Cleanup function for this effect
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [roomId, apiKey, API_BASE_URL, isLoading, error, messages, handleLogout, roomDetails]);

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !apiKey || !roomId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({ body: newMessageBody.trim() }),
      });
      // Assuming your API returns the new message object on success
      const data: PostMessageResponse = await response.json();

      if (response.ok && data.success && data.message) {
        setMessages(prevMessages => [...prevMessages, data.postedMessage!]);
      } else {
        alert(`Failed to post message: ${data.message || 'Unknown error from server'}`);
      }
    } catch (err) {
      console.error('Error posting message:', err);
      alert(`Error posting message: ${err instanceof Error ? err.message : "Network error"}`);
    }
  };

  const handleRenameRoom = async () => {
    if (!editableRoomName.trim() || !apiKey || !roomId || !roomDetails) return;
    if (editableRoomName.trim() === roomDetails.name) {
      setIsEditingRoomName(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({ new_name: editableRoomName.trim() }),
      });
      const data: ApiResponse = await response.json();
      if (response.ok && data.success) {
        setRoomDetails(prev => prev ? { ...prev, name: editableRoomName.trim() } : null);
        setIsEditingRoomName(false);
        // Optionally, update the global room list if App.tsx manages it and passes an updater function
      } else {
        alert(`Failed to rename room: ${data.message || 'Error from server'}`);
      }
    } catch (err) {
      alert(`Error renaming room: ${err instanceof Error ? err.message : "Network error"}`);
      console.error(err);
    }
  };

  if (isLoading && !error) { // Show loading only if not an error state already
    return <div className="page-container room-page-container"><p>Loading room...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container room-page-container">
        <div className="header app-header-common"> {/* Assuming common header styles */}
          <h2><Link to="/">Watch Party</Link></h2><h4>4</h4>
          {currentUser && (
            <div className="login-profile-header">
              <div className="loggedIn-area">
                <Link to="/profile" className="username-display">{currentUser.name}</Link>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            </div>
          )}
        </div>
        <div className="clip">
          <div className="container noMessages">
            <h2>Oops, something went wrong!</h2>
            <p>{error}</p>
            <p><Link to="/">Let's go home and try again.</Link></p>
          </div>
        </div>
      </div>
    );
  }

  if (!roomDetails) { // Should be caught by error state if fetch failed
    return (
      <div className="page-container room-page-container">
        <div className="header app-header-common">
          <h2><Link to="/">Watch Party</Link></h2><h4>4</h4>
        </div>
        <div className="clip">
          <div className="container noMessages">
            <h2>Room not available.</h2>
            <p><Link to="/">Return to lobby.</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container room-page-container"> {/* Use global .page-container */}
      <div className="header app-header-common"> {/* Use global .app-header-common */}
        <h2><Link to="/">Watch Party</Link></h2>
        <h4>4</h4>
        <div className="roomDetail">
          {!isEditingRoomName ? (
            <div className="displayRoomName">
              <h3>
                Chatting in <strong>{roomDetails.name}</strong>
                <button onClick={() => { setEditableRoomName(roomDetails.name); setIsEditingRoomName(true); }} className="edit-icon-button">
                  <span className="material-symbols-outlined md-18">edit</span>
                </button>
              </h3>
            </div>
          ) : (
            <div className="editRoomName">
              <h3>
                Chatting in <input type="text" value={editableRoomName} onChange={(e) => setEditableRoomName(e.target.value)} autoFocus />
                <button onClick={handleRenameRoom}>Update</button>
                <button onClick={() => setIsEditingRoomName(false)}>Cancel</button>
              </h3>
            </div>
          )}
          Invite: <Link to={`/room/${roomId}`}>{window.location.origin}/room/{roomId}</Link>
        </div>
        {currentUser && (
          <div className="login-profile-header">  {/* Use global .login-profile-header */}
            <div className="loggedIn-area">
              <Link to="/profile" className="username-display">{currentUser.name}</Link>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          </div>
        )}
      </div>

      <div className="clip">
        <div className="room-content-container"> {/* Specific to room layout */}
          <div className="chat">
            <div className="messages-area">
              {messages.length === 0 && !isLoading ? (
                 <div className="noMessages-in-room">
                    <p>No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="message-entry">
                    <span className="author">{msg.author || `User ID: ${msg.user_id}`}:</span>
                    <span className="content">{msg.body}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="comment_box">
              <form onSubmit={handlePostMessage}>
                <label htmlFor="comment_textarea">What do you have to say?</label> {/* Corrected htmlFor */}
                <textarea
                  id="comment_textarea" // Added id
                  name="comment"
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostMessage(e);
                    }
                  }}
                  required
                />
                <button type="submit">Post</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoomComponent;