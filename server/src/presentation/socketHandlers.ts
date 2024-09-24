import { Server, Socket } from "socket.io";
import {
  handleJoinGame,
  handleStartGame,
  handleMergeItems,
  handleSwapItems,
  handleDisconnect,
} from "../application/gameManager";

export function registerSocketHandlers(io: Server, socket: Socket) {
  socket.on("join_game", (name: string) => {
    handleJoinGame(io, socket, name);
  });

  socket.on("start_game", () => {
    handleStartGame(io, socket);
  });

  socket.on("merge_items", ({ x, y, x2, y2 }) => {
    handleMergeItems(io, socket, x, y, x2, y2);
  });

  socket.on("swap_items", ({ x, y, x2, y2 }) => {
    handleSwapItems(io, socket, x, y, x2, y2);
  });

  socket.on("disconnect", () => {
    handleDisconnect(io, socket);
  });
}
