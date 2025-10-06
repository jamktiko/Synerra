// Interface for a chat message object, that is sent to the websocket server.

export interface ChatMessage {
  senderId: string;
  senderUsername: string;
  message: string;
  profilePicture: string;
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
