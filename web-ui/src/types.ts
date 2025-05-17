// web-ui/src/types.ts

export interface User {
    id: number;
    name: string;
    api_key?: string; // Optional: not always present in every User object context
}

export interface Room {
    id: number;
    name: string;
}

export interface Message {
    id: number;
    user_id: number; // ID of the user who posted
    room_id: number;
    body: string;
    author: string;  // Name of the user who posted (ensure your API provides this)
}

// --- API Response Interfaces ---

// For general API responses that primarily indicate success/failure with a string message
export interface ApiResponse {
    success: boolean;
    message?: string; // e.g., "Password updated successfully.", "Invalid input."
}

// For /api/signup and /api/login
export interface ApiKeyResponse extends ApiResponse { // Extends because it also has success/message
    api_key: string;
    user_name: string;
    user_id: number;
}

// For GET /api/user/profile
export interface UserProfileResponse extends ApiResponse { // Extends because it also has success/message
    user_id: number;
    user_name: string;
    // Avoid sending api_key or password here
}

// For POST /api/rooms (creating a room)
export interface CreateRoomResponse extends ApiResponse { // Extends because it also has success/message
    room?: Room; // The newly created Room object
}

// For POST /api/rooms/:id/messages (posting a message)
export interface PostMessageResponse extends ApiResponse {
    postedMessage?: Message; // Or 'newMessageData', 'data', etc.
}