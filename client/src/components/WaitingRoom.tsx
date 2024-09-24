interface WaitingRoomProps {
  name: string;
  setName: (name: string) => void;
  handleJoin: () => void;
}

export default function WaitingRoom({
  name,
  setName,
  handleJoin,
}: WaitingRoomProps) {
  return (
    <div className="join-screen">
      <div className="player-join">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleJoin}>Join Game</button>
      </div>
    </div>
  );
}
