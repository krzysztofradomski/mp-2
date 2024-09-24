import { useState } from "react";
import { Socket } from "socket.io-client";
import { ItemType } from "../state/types";

interface BoardProps {
  board: ItemType[][] | undefined;
  playerId: string;
  socket: Socket;
  isOwnBoard: boolean;
  gameStarted: boolean;
}

export default function Board({
  board,
  playerId,
  socket,
  isOwnBoard,
  gameStarted,
}: BoardProps) {
  const [draggedItem, setDraggedItem] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [validDropCells, setValidDropCells] = useState<{
    [key: string]: boolean;
  }>({});

  if (!board) return null;

  const handleDragStart = (e: React.DragEvent, x: number, y: number) => {
    setDraggedItem({ x, y });
    console.log("drag start", { e, x, y });
  };

  const handleDragEnter = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const fromX = draggedItem.x;
    const fromY = draggedItem.y;
    const isAdjacent = Math.abs(fromX - x) + Math.abs(fromY - y) === 1;

    if (isAdjacent) {
      setValidDropCells((prev) => ({
        ...prev,
        [`${x}-${y}`]: true,
      }));
    } else {
      setValidDropCells((prev) => ({
        ...prev,
        [`${x}-${y}`]: false,
      }));
    }
  };

  const handleDragLeave = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setValidDropCells((prev) => {
      const newState = { ...prev };
      delete newState[`${x}-${y}`];
      return newState;
    });
  };

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    console.log("drag over", { e, x, y });
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const fromX = draggedItem.x;
    const fromY = draggedItem.y;

    if (isOwnBoard && gameStarted) {
      const isAdjacent = Math.abs(fromX - x) + Math.abs(fromY - y) === 1;

      if (isAdjacent) {
        socket.emit("merge_items", { x: fromX, y: fromY, x2: x, y2: y });
        socket.emit("swap_items", { x: fromX, y: fromY, x2: x, y2: y });
      }
    }
    setDraggedItem(null);
    setValidDropCells({});
  };

  console.log(board, playerId, isOwnBoard, gameStarted);

  return (
    <div className={`board ${isOwnBoard ? "own-board" : "opponent-board"}`}>
      {board.map((row, y) =>
        row.map((item, x) => {
          const cellKey = `${x}-${y}`;
          const isValidDrop = validDropCells[cellKey];

          return (
            <div
              key={cellKey}
              className={`cell ${item || ""} ${
                isValidDrop === true
                  ? "valid-drop"
                  : isValidDrop === false
                  ? "invalid-drop"
                  : ""
              }`}
              draggable={isOwnBoard && !!item && gameStarted}
              onDragStart={(e) => handleDragStart(e, x, y)}
              onDragEnter={(e) => handleDragEnter(e, x, y)}
              onDragLeave={(e) => handleDragLeave(e, x, y)}
              onDragOver={(e) => handleDragOver(e, x, y)}
              onDrop={(e) => handleDrop(e, x, y)}
            />
          );
        })
      )}
    </div>
  );
}
