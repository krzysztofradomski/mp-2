import WaitingRoom from "./components/WaitingRoom";
import Stage from "./components/Stage";
import useGameState from "./state/useGameState";
import { socket } from "./state/socket";

function App() {
  const {
    gameState,
    name,
    setName,
    playerId,
    handleJoin,
    handleStartGame,
    opponentLeft,
  } = useGameState();
  return (
    <div className="app">
      {!playerId ? (
        <WaitingRoom name={name} setName={setName} handleJoin={handleJoin} />
      ) : (
        <Stage
          playerId={playerId}
          gameState={gameState}
          socket={socket}
          onStartGame={handleStartGame}
          opponentLeft={opponentLeft}
        />
      )}
    </div>
  );
}

export default App;
