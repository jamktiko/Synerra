export interface Friend {
  // Interface and example data:
  PK: string; // USER#b0ac990c-a021-7002-788b-4d5c2f912fa9
  SK: string; // FRIEND#b05cf97c-a041-7006-921d-af77cf1abab8
  CreatedAt: number; // 1758698340
  Relation: string; // FRIEND
}

export interface WebsocketFriendRequest {
  fromUserId: string;
  fromUsername: string;
  senderPicture: string;
  type: string;
  timestamp: number;
  toUserId?: string;
  status: string;
}
