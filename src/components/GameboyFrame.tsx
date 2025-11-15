import React, { useEffect, useState, ReactNode } from "react";
import "./GameboyFrame.css";

type Props = {
  children?: ReactNode; // place <GameLoop/> here later
};

const GameboyFrame: React.FC<Props> = ({ children }) => {
  const [dpad, setDpad] = useState<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const [aPressed, setAPressed] = useState(false);
  const [bPressed, setBPressed] = useState(false);

  // Dummy handlers
  const handleDpad = (
    dir: "up" | "down" | "left" | "right",
    pressed: boolean
  ) => {
    setDpad((prev) => ({ ...prev, [dir]: pressed }));
    if (pressed) console.log(`D-PAD ${dir} pressed`);
    else console.log(`D-PAD ${dir} released`);
  };
  const handleA = (pressed: boolean) => {
    setAPressed(pressed);
    if (pressed) console.log("A pressed");
    else console.log("A released");
  };
  const handleB = (pressed: boolean) => {
    setBPressed(pressed);
    if (pressed) console.log("B pressed");
    else console.log("B released");
  };

  // Keyboard mappings: arrows or WASD -> dpad, Z -> A, X -> B
  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      switch (k) {
        case "arrowup":
        case "w":
          handleDpad("up", true);
          break;
        case "arrowdown":
        case "s":
          handleDpad("down", true);
          break;
        case "arrowleft":
        case "a":
          handleDpad("left", true);
          break;
        case "arrowright":
        case "d":
          handleDpad("right", true);
          break;
        case "z":
          handleA(true);
          break;
        case "x":
          handleB(true);
          break;
        default:
          break;
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      switch (k) {
        case "arrowup":
        case "w":
          handleDpad("up", false);
          break;
        case "arrowdown":
        case "s":
          handleDpad("down", false);
          break;
        case "arrowleft":
        case "a":
          handleDpad("left", false);
          break;
        case "arrowright":
        case "d":
          handleDpad("right", false);
          break;
        case "z":
          handleA(false);
          break;
        case "x":
          handleB(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  return (
    <div className="gb-wrap">
      <div className="gb-shell">
        <div className="gb-top-speaker" aria-hidden />
        <div className="gb-screen">
          <div className="gb-screen-inner">
            {/* Put <GameLoop/> here later, or pass it as children */}
            {children}
          </div>
        </div>

        <div className="gb-controls">
          <div className="gb-dpad" role="group" aria-label="D-Pad">
            <button
              className={`dpad-btn up ${dpad.up ? "active" : ""}`}
              onMouseDown={() => handleDpad("up", true)}
              onMouseUp={() => handleDpad("up", false)}
              onMouseLeave={() => handleDpad("up", false)}
              aria-label="Up"
            />
            <button
              className={`dpad-btn left ${dpad.left ? "active" : ""}`}
              onMouseDown={() => handleDpad("left", true)}
              onMouseUp={() => handleDpad("left", false)}
              onMouseLeave={() => handleDpad("left", false)}
              aria-label="Left"
            />
            <button
              className={`dpad-btn right ${dpad.right ? "active" : ""}`}
              onMouseDown={() => handleDpad("right", true)}
              onMouseUp={() => handleDpad("right", false)}
              onMouseLeave={() => handleDpad("right", false)}
              aria-label="Right"
            />
            <button
              className={`dpad-btn down ${dpad.down ? "active" : ""}`}
              onMouseDown={() => handleDpad("down", true)}
              onMouseUp={() => handleDpad("down", false)}
              onMouseLeave={() => handleDpad("down", false)}
              aria-label="Down"
            />
          </div>

          <div className="gb-buttons">
            <button
              className={`action-btn b ${bPressed ? "active" : ""}`}
              onMouseDown={() => handleB(true)}
              onMouseUp={() => handleB(false)}
              onMouseLeave={() => handleB(false)}
              aria-label="B button"
            >
              B
            </button>
            <button
              className={`action-btn a ${aPressed ? "active" : ""}`}
              onMouseDown={() => handleA(true)}
              onMouseUp={() => handleA(false)}
              onMouseLeave={() => handleA(false)}
              aria-label="A button"
            >
              A
            </button>
          </div>
        </div>

        <div className="gb-bottom" aria-hidden />
      </div>
    </div>
  );
};

export default GameboyFrame;
