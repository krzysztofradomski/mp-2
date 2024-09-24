export type ItemType = "red" | "green" | "yellow" | "blue" | "orange" | null;

export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  boards: { [playerId: string]: ItemType[][] };
  players: { [playerId: string]: PlayerInfo };
  timer: number;
  gameStarted: boolean;
  winner: string | null;
  gameEnded: boolean;
}
