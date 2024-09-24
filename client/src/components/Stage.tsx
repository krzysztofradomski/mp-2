import { Socket } from "socket.io-client";
import { GameState } from "../state/types";
import Timer from "./Timer";
import Board from "./Board";

interface StageProps {
  playerId: string;
  gameState: GameState;
  socket: Socket;
  onStartGame: () => void;
  opponentLeft: boolean;
}

export default function Stage({
  playerId,
  gameState,
  socket,
  onStartGame,
  opponentLeft,
}: StageProps) {
  const player = gameState.players[playerId];
  const opponentId = Object.keys(gameState.players).find(
    (id) => id !== playerId
  );
  const opponent = opponentId ? gameState.players[opponentId] : null;

  return (
    <div className="game-screen">
      {opponentLeft && (
        <div className="result-popup">Your opponent has left the game.</div>
      )}
      <div className="player-info">
        <h2>{player?.name}</h2>
        {player?.name ? <h4>(you)</h4> : null}
        <p>Score: {player?.score}</p>
      </div>
      <div className="opponent-info">
        <h2>{opponent?.name || "Waiting for opponent..."}</h2>
        {opponent?.name ? <h4>(opponent)</h4> : null}
        <p>Score: {opponent?.score || 0}</p>
      </div>
      <Timer time={gameState.timer} />
      <div className="boards">
        <Board
          board={gameState.boards[playerId]}
          playerId={playerId}
          socket={socket}
          isOwnBoard={true}
          gameStarted={gameState.gameStarted}
        />
        {opponentId && (
          <Board
            board={gameState.boards[opponentId]}
            playerId={opponentId}
            socket={socket}
            isOwnBoard={false}
            gameStarted={gameState.gameStarted}
          />
        )}
        {!gameState.gameStarted &&
          !gameState.gameEnded &&
          Object.keys(gameState.players).length === 2 && (
            <div className="start-game-button">
              <button onClick={onStartGame}>Start Game</button>
            </div>
          )}
      </div>
      {gameState.gameEnded && !opponentLeft && (
        <div className="result-popup">
          {gameState.winner === "draw"
            ? "Draw"
            : gameState.winner === playerId
            ? "Victory"
            : "Defeat"}
        </div>
      )}
    </div>
  );
}
