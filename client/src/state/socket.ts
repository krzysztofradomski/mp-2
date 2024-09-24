import io from "socket.io-client";

const PORT = process.env.PORT || 4000;
const baseUrl = window.location.origin.includes("localhost")
  ? "http://localhost"
  : "https://server-bold-darkness-3069.fly.dev";

export const socket = io(`${baseUrl}:${PORT}`);
