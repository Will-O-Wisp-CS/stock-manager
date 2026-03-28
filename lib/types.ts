// Firestore のデータ型定義

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  projectId: string;
  name: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreHistory {
  id: string;
  projectId: string;
  fromPlayerId?: string;
  fromPlayerName?: string;
  toPlayerId?: string;
  toPlayerName?: string;
  points?: number;
  playerId?: string;
  playerName?: string;
  oldScore?: number;
  newScore?: number;
  difference?: number;
  timestamp: Date;
  note?: string;
  type?: 'direct' | 'transfer';
}

// コレクション名
export const COLLECTIONS = {
  PROJECTS: 'projects',
  PLAYERS: 'players',
  SCORE_HISTORY: 'scoreHistory',
};
