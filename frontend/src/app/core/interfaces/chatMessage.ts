// Interface for a chat message object, that is sent to the websocket server.

export interface ChatMessage {
  SenderId: string;
  SenderUsername: string;
  Content: string;
  ProfilePicture: string;
  Timestamp: number;
}

export interface UnreadMessage {
  SenderId: string;
  GSI1PK: string;
  Timestamp: number;
  ProfilePicture: string;
  RoomId: string;
  MessageId: number;
  Content: string;
  SK: string;
  SenderUsername: string;
  PK: string;
  GSI1SK: string;
}

export interface NormalizedMessage {
  senderUsername: string;
  content: string;
  timestamp: number;
  roomId: string;
  profilePicture: string;
}

export interface NormalizedRequest {
  fromUsername: string;
  timestamp: number;
  fromUserId: string;
  senderPicture: string;
  status: string;
  message: string;
  type: string;
  toUserId: string;
}
