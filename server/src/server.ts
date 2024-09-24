import express from "express";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./presentation/socketHandlers";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // maybe fix later xD
  },
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);
  registerSocketHandlers(io, socket);
});
