export interface FriendRequest {
  // Interface and example data:
  PK: string; // USER#b0ac990c-a021-7002-788b-4d5c2f912fa9
  SK: string; // FRIEND_REQUEST#60cc893c-8081-701c-4f5a-c17db8f2dcb4
  CreatedAt?: number; // USER#60cc893c-8081-701c-4f5a-c17db8f2dcb4
  GSI1PK?: string; // USER#60cc893c-8081-701c-4f5a-c17db8f2dcb4
  GSI1SK?: string; // FRIEND_REQUEST#b0ac990c-a021-7002-788b-4d5c2f912fa9
  Relation?: string; // FRIEND_REQUEST
  Status?: string; // PENDING
}
