import { Server, Socket } from "socket.io";
import { GameState, games, ItemType } from "./gameState";

const COLORS: ItemType[] = ["red", "green", "yellow", "blue", "orange"];
const BOARD_SIZE = 4;

export function createBoard(): ItemType[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
    );
}

export function addItemToBoard(board: ItemType[][]): void {
  const emptyCells: { x: number; y: number }[] = [];
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (!cell) emptyCells.push({ x, y });
    })
  );
  if (emptyCells.length > 0) {
    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[y][x] = COLORS[Math.floor(Math.random() * COLORS.length)];
  }
}

export function getPlayerRoom(socket: Socket): string | null {
  const rooms = Array.from(socket.rooms);
  // The first room is the socket's own room (socket.id)
  // So we need to check the second room, if any
  // This is maybe not the best way to do this, but it works for now
  if (rooms.length > 1) {
    return rooms[1];
  }
  return null;
}

export function startGame(io: Server, roomId: string): void {
  const gameState = games[roomId];
  if (gameState) {
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    gameState.timer = 60;
    gameState.winner = null;

    // Reset players' scores and boards
    for (const playerId in gameState.players) {
      gameState.players[playerId].score = 0;
      // gameState.boards[playerId] = createBoard();
    }

    io.to(roomId).emit("game_state", gameState);

    gameTimer(io, roomId);

    itemInterval(io, roomId);
  }
}

function gameTimer(io: Server, roomId: string): void {
  const gameState = games[roomId];
  if (!gameState) return;

  const timerInterval = setInterval(() => {
    if (!gameState.gameStarted) {
      clearInterval(timerInterval);
      return;
    }

    if (gameState.timer > 0) {
      gameState.timer -= 1;
      io.to(roomId).emit("timer_update", gameState.timer);
    } else {
      clearInterval(timerInterval);
      endGame(io, roomId);
    }
  }, 1000);
}

function itemInterval(io: Server, roomId: string): void {
  const gameState = games[roomId];
  if (!gameState) return;

  const addItemInterval = setInterval(() => {
    if (!gameState.gameStarted) {
      clearInterval(addItemInterval);
      return;
    }
    for (const playerId in gameState.boards) {
      addItemToBoard(gameState.boards[playerId]);
    }
    io.to(roomId).emit("game_state", gameState);
  }, 3000);
}

function endGame(io: Server, roomId: string): void {
  const gameState = games[roomId];
  if (!gameState) return;

  gameState.gameStarted = false;
  gameState.gameEnded = true;
  gameState.winner = checkForWinner(gameState);

  io.to(roomId).emit("game_ended", gameState.winner);
}

function checkForWinner(gameState: GameState): string {
  const playerIds = Object.keys(gameState.players);
  const [player1, player2] = playerIds;
  const score1 = gameState.players[player1]?.score || 0;
  const score2 = gameState.players[player2]?.score || 0;
  if (score1 > score2) return player1;
  if (score2 > score1) return player2;
  return "draw";
}

export function handleMergeItems(
  io: Server,
  roomId: string,
  playerId: string,
  x: number,
  y: number,
  x2: number,
  y2: number
): void {
  const gameState = games[roomId];
  if (!gameState) return;

  const board = gameState.boards[playerId];
  const item1 = board[y][x];
  const item2 = board[y2][x2];
  const isAdjacent = Math.abs(x - x2) + Math.abs(y - y2) === 1;

  if (item1 && item2 && item1 === item2 && isAdjacent) {
    board[y][x] = null;
    board[y2][x2] = null;
    gameState.players[playerId].score += 1;

    io.to(roomId).emit("game_state", gameState);
  }
}

export function handleSwapItems(
  io: Server,
  roomId: string,
  playerId: string,
  x: number,
  y: number,
  x2: number,
  y2: number
): void {
  const gameState = games[roomId];
  if (!gameState) return;

  const board = gameState.boards[playerId];
  const item1 = board[y][x];
  const item2 = board[y2][x2];
  const isAdjacent = Math.abs(x - x2) + Math.abs(y - y2) === 1;

  if (isAdjacent) {
    board[y][x] = item2;
    board[y2][x2] = item1;

    io.to(roomId).emit("game_state", gameState);
  }
}
