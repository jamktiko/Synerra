export interface FriendRequest {
  PK: string; // Partition key, e.g., `USER#<senderId>`
  SK: string; // Sort key, e.g., `FRIEND_REQUEST#<targetUserId>`
  GSI1PK: string; // For querying requests by target
  GSI1SK: string; // Reverse lookup
  Relation: 'FRIEND_REQUEST'; // Relation type
  Status: 'PENDING' | 'ACCEPTED' | 'DECLINED'; // Current status
  CreatedAt: number; // Timestamp
  SenderUsername: string; // Username of sender
  SenderPicture: string; // Profile picture URL of sender
  SenderId: string;
}
