// user.model.ts
export interface User {
  PK: string; // e.g., "USER#b0ac990c-a021-7002-788b-4d5c2f912fa9"
  SK: string; // e.g., "PROFILE"
  AverageReputation?: number; // optional, e.g., 60
  CreatedAt?: number; // optional timestamp
  Email?: string;
  Bio?: string;
  GSI3PK?: string; // e.g., "USER"
  ProfilePicture?: string; // URL to S3
  ReputationCount?: number;
  Reputations?: Record<string, any>; // Map of reputation data
  UserId?: string;
  Username?: string;
  Languages?: string[];
}
