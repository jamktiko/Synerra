// Interface for a chat message object, that is sent to the websocket server.

export interface ChatMessage {
  senderId: string;
  senderUsername: string;
  message: string;
}
