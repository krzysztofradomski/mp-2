import { useState, useEffect } from "react";
import { GameState } from "./types";
import { socket } from "./socket";

export default function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    boards: {},
    players: {},
    timer: 60,
    gameStarted: false,
    winner: null,
    gameEnded: false,
  });
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  useEffect(() => {
    socket.on("game_state", (state: GameState) => {
      setGameState(state);
      setOpponentLeft(false);
    });

    socket.on("timer_update", (time: number) => {
      setGameState((prevState) => ({ ...prevState, timer: time }));
    });

    socket.on("game_ended", (winner: string) => {
      setGameState((prevState) => ({
        ...prevState,
        gameEnded: true,
        winner,
        gameStarted: false,
      }));
    });

    socket.on("opponent_left", () => {
      setOpponentLeft(true);
      setGameState((prevState) => ({
        ...prevState,
        gameStarted: false,
        gameEnded: true,
      }));
    });

    return () => {
      socket.off("game_state");
      socket.off("timer_update");
      socket.off("game_ended");
      socket.off("opponent_left");
    };
  }, []);

  const handleJoin = () => {
    socket.emit("join_game", name);
    if (socket.id) setPlayerId(socket.id);
  };

  const handleStartGame = () => {
    socket.emit("start_game");
  };
  return {
    gameState,
    name,
    setName,
    playerId,
    handleJoin,
    handleStartGame,
    opponentLeft,
  };
}
