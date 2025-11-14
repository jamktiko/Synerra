// Interface and example data:
export interface User {
  PK?: string; // "USER#b0ac990c-a021-7002-788b-4d5c2f912fa9"
  SK?: string; // "PROFILE"
  AverageReputation?: number; //60
  CreatedAt?: number; // optional timestamp
  Email?: string; // test@test.fi
  Bio?: string; // Tykki pelaaja, tulkaa pelaa
  GSI3PK?: string; // "USER"
  ProfilePicture?: string; // https://synerra-pfp.s3.eu-north-1.amazonaws.com/profile-pictures/b05cf97c-a041-7006-921d-af77cf1abab8/testmanpfp
  ReputationCount?: number; // 2
  Reputations?: Record<string, any>; // Map of reputation data
  UserId?: string; // b0ac990c-a021-7002-788b-4d5c2f912fa9"
  Username?: string; // TestMan
  Username_Lower?: string;
  Languages?: string[]; // [ru, fi]
  PlayedGames?: { gameId: string; gameName: string }[]; // [{gameName:'Valorant',gameId:'asfiphqwiphgiåqhå'}]
  Birthday?: Date;
  Status?: string;
  AverageTeamwork?: number;
  AverageComms?: number;
  AverageMentality?: number;
  MainReputation?: number;
  Playstyle?: string;
  Platform?: string[];
}

export interface UserFilters {
  username?: string | null;
  languages?: string[];
  games?: string[];
  Status?: string;
  playstyle?: string;
  platform?: string[];
}

export interface Country {
  languages?: { [code: string]: string };
}

export interface Language {
  code: string;
  name: string;
}
