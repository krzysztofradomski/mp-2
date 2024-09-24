export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
}

export type ItemType = "red" | "green" | "yellow" | "blue" | "orange" | null;

export interface GameState {
  players: { [playerId: string]: PlayerInfo };
  boards: { [playerId: string]: ItemType[][] };
  timer: number;
  gameStarted: boolean;
  winner: string | null;
  gameEnded: boolean;
}

export const games: { [roomId: string]: GameState } = {};
