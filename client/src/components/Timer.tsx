interface TimerProps {
  time: number;
}

export default function Timer({ time }: TimerProps) {
  return (
    <>
      <div className="timer">
        <div className="timer-bar" style={{ width: `${(time / 60) * 100}%` }} />
      </div>
      <div className="timer-countdown">{time}s left</div>
    </>
  );
}
