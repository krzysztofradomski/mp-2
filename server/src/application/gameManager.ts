import { Server, Socket } from "socket.io";
import { games, GameState, PlayerInfo } from "../domain/gameState";
import {
  startGame,
  getPlayerRoom,
  handleMergeItems as domainHandleMergeItems,
  handleSwapItems as domainHandleSwapItems,
  createBoard,
} from "../domain/gameLogic";

let waitingPlayers: Socket[] = [];

export function handleJoinGame(io: Server, socket: Socket, name: string) {
  (socket as any).data = { name };
  waitingPlayers.push(socket);

  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.shift()!;
    const player2 = waitingPlayers.shift()!;

    const roomId = `game-${player1.id}-${player2.id}`;

    player1.join(roomId);
    player2.join(roomId);

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

    io.to(roomId).emit("game_state", gameState);
  }
}

export function handleStartGame(io: Server, socket: Socket) {
  const roomId = getPlayerRoom(socket);
  if (roomId && !games[roomId].gameStarted) {
    startGame(io, roomId);
  }
}

export function handleMergeItems(
  io: Server,
  socket: Socket,
  x: number,
  y: number,
  x2: number,
  y2: number
) {
  const roomId = getPlayerRoom(socket);
  if (roomId) {
    domainHandleMergeItems(io, roomId, socket.id, x, y, x2, y2);
  }
}

export function handleSwapItems(
  io: Server,
  socket: Socket,
  x: number,
  y: number,
  x2: number,
  y2: number
) {
  const roomId = getPlayerRoom(socket);
  if (roomId) {
    domainHandleSwapItems(io, roomId, socket.id, x, y, x2, y2);
  }
}

export function handleDisconnect(io: Server, socket: Socket) {
  console.log(`Player disconnected: ${socket.id}`);
  // This needs to be improved
  waitingPlayers = waitingPlayers.filter((player) => player.id !== socket.id);

  const roomId = getPlayerRoom(socket);
  if (roomId) {
    const gameState = games[roomId];
    if (gameState) {
      socket.to(roomId).emit("opponent_left");
      delete games[roomId];
    }
  }
}
