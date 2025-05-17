// create types for different parts
export interface User {
    id: number;
    name: string;
    api_key?: string; 
  }
  
  export interface Room {
    id: number;
    name: string;
  }
  
  export interface Message {
    id: number;
    user_id: number;
    room_id: number;
    body: string;
    author: string;
  }
  
  export interface ApiKeyResponse {
    success: boolean;
    api_key: string;
    user_name: string;
    user_id: number;
    message?: string;
  }
  
  export interface UserProfileResponse {
      success: boolean;
      user_id: number;
      user_name: string;
      message?: string;
  }
  
  export interface ApiResponse {
      success: boolean;
      message?: string;
  }
  
  export interface CreateRoomResponse extends ApiResponse {
      room?: Room;
  }