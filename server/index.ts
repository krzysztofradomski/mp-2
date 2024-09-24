// src/server.ts

import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production for security
  },
});

// Matchmaking queue
let waitingPlayers: Socket[] = [];

// Game rooms and their states
interface PlayerInfo {
  id: string;
  name: string;
  score: number;
}

type ItemType = "red" | "green" | "yellow" | "blue" | "orange" | null;

interface GameState {
  players: { [playerId: string]: PlayerInfo };
  boards: { [playerId: string]: ItemType[][] };
  timer: number;
  gameStarted: boolean;
  winner: string | null;
  gameEnded: boolean;
}

const games: { [roomId: string]: GameState } = {};

// Constants
const COLORS: ItemType[] = ["red", "green", "yellow", "blue", "orange"];
const BOARD_SIZE = 4;

// Helper Functions
function createBoard(): ItemType[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
    );
}

function addItemToBoard(board: ItemType[][]): void {
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

function getPlayerRoom(socket: Socket): string | null {
  const rooms = Array.from(socket.rooms);
  // The first room is the socket's own room (socket.id)
  // So we need to check the second room, if any
  if (rooms.length > 1) {
    return rooms[1];
  }
  return null;
}

// Socket.IO event handling
io.on("connection", (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join_game", (name: string) => {
    (socket as any).data = { name };
    waitingPlayers.push(socket);

    if (waitingPlayers.length >= 2) {
      // Match two players
      const player1 = waitingPlayers.shift()!;
      const player2 = waitingPlayers.shift()!;

      const roomId = `game-${player1.id}-${player2.id}`;

      // Join players to the room
      player1.join(roomId);
      player2.join(roomId);

      // Initialize game state for the room
      const gameState: GameState = {
        players: {
          [player1.id]: {
            id: player1.id,
            name: (player1 as any).data.name,
            score: 0,
          },
          [player2.id]: {
            id: player2.id,
            name: (player2 as any).data.name,
            score: 0,
          },
        },
        boards: {
          [player1.id]: createBoard(),
          [player2.id]: createBoard(),
        },
        timer: 60,
        gameStarted: false,
        winner: null,
        gameEnded: false,
      };

      games[roomId] = gameState;

      // Notify players of game state
      io.to(roomId).emit("game_state", gameState);
    }
  });

  socket.on("start_game", () => {
    const roomId = getPlayerRoom(socket);
    if (roomId && !games[roomId].gameStarted) {
      startGame(roomId);
    }
  });

  socket.on(
    "merge_items",
    ({ x, y, x2, y2 }: { x: number; y: number; x2: number; y2: number }) => {
      const roomId = getPlayerRoom(socket);
      if (roomId) {
        handleMergeItems(roomId, socket.id, x, y, x2, y2);
      }
    }
  );

  socket.on(
    "swap_items",
    ({ x, y, x2, y2 }: { x: number; y: number; x2: number; y2: number }) => {
      const roomId = getPlayerRoom(socket);
      if (roomId) {
        handleSwapItems(roomId, socket.id, x, y, x2, y2);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from waiting players if still waiting
    waitingPlayers = waitingPlayers.filter((player) => player.id !== socket.id);

    // Find and handle the game the player was in
    const roomId = getPlayerRoom(socket);
    if (roomId) {
      const gameState = games[roomId];
      if (gameState) {
        // Notify the other player and end the game
        socket.to(roomId).emit("opponent_left");
        delete games[roomId];
      }
    }
  });
});

// Game Logic Functions
function startGame(roomId: string): void {
  const gameState = games[roomId];
  if (gameState) {
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    gameState.timer = 60;
    gameState.winner = null;

    // Reset players' scores
    for (const playerId in gameState.players) {
      gameState.players[playerId].score = 0;
      gameState.boards[playerId] = createBoard();
    }

    io.to(roomId).emit("game_state", gameState);

    // Start the game timer
    gameTimer(roomId);
    // Start adding items at intervals
    itemInterval(roomId);
  }
}

function gameTimer(roomId: string): void {
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
      endGame(roomId);
    }
  }, 1000);
}

function itemInterval(roomId: string): void {
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

function endGame(roomId: string): void {
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

function handleMergeItems(
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

function handleSwapItems(
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

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
