"use client";

import { useEffect, useRef } from "react";
import { Direction, Ghost, JevSystemOneDecision, PacmanEntity } from "@/types/game";
import { COLS, ROWS } from "@/engine/maze";

interface GameCanvasProps {
  mapState: number[][];
  pacman: PacmanEntity;
  ghosts: Ghost[];
  latestDecision: JevSystemOneDecision | null;
  aiVisionOverlay: boolean;
  tileSize?: number;
}

export function GameCanvas({
  mapState,
  pacman,
  ghosts,
  latestDecision,
  aiVisionOverlay,
  tileSize = 19,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle HiDPI retina displays
    const dpr = window.devicePixelRatio || 1;
    const width = COLS * tileSize;
    const height = ROWS * tileSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // 1. Clear & Background (Clean off-white canvas with subtle architectural dot grid)
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid dots
    ctx.fillStyle = "#e4e4e7";
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        ctx.fillRect(x + tileSize / 2 - 0.5, y + tileSize / 2 - 0.5, 1, 1);
      }
    }

    // 2. Render Maze Walls & Pellets
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = mapState[r][c];
        const px = c * tileSize;
        const py = r * tileSize;

        if (tile === 1) {
          // Monochromatic Wall: Crisp dark charcoal with inner bevel
          ctx.fillStyle = "#18181b";
          ctx.fillRect(px, py, tileSize, tileSize);

          ctx.strokeStyle = "#27272a";
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
        } else if (tile === 5) {
          // Ghost Gate (horizontal hatched barrier)
          ctx.strokeStyle = "#71717a";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(px, py + tileSize / 2);
          ctx.lineTo(px + tileSize, py + tileSize / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (tile === 2) {
          // Pellet: Minimalist solid black dot
          ctx.fillStyle = "#27272a";
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, Math.max(2.5, tileSize * 0.13), 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 3) {
          // Power Pellet: Pulsing dark ring
          const pulse = (Math.sin(Date.now() * 0.008) + 1) * (tileSize * 0.04) + tileSize * 0.28;
          ctx.fillStyle = "#09090b";
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#71717a";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, pulse + 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 3. AI Vision Overlay (Rays, Target vectors, Threat circles)
    if (aiVisionOverlay) {
      const pacPx = pacman.x * tileSize + tileSize / 2;
      const pacPy = pacman.y * tileSize + tileSize / 2;

      // Draw ghost danger zones
      for (const ghost of ghosts) {
        const gPx = ghost.x * tileSize + tileSize / 2;
        const gPy = ghost.y * tileSize + tileSize / 2;

        if (ghost.mode === "CHASE" || ghost.mode === "SCATTER") {
          ctx.strokeStyle = "rgba(24, 24, 27, 0.18)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.arc(gPx, gPy, 2.5 * tileSize, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ray to Pac-Man if nearby
          const dist = Math.hypot(gPx - pacPx, gPy - pacPy);
          if (dist < 7 * tileSize) {
            ctx.strokeStyle = "rgba(24, 24, 27, 0.22)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(gPx, gPy);
            ctx.lineTo(pacPx, pacPy);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw JEV Chosen Direction Arrow
      if (latestDecision && latestDecision.action !== "NONE") {
        let dx = 0;
        let dy = 0;
        const arrowLen = tileSize * 1.5;
        if (latestDecision.action === "UP") dy = -arrowLen;
        else if (latestDecision.action === "DOWN") dy = arrowLen;
        else if (latestDecision.action === "LEFT") dx = -arrowLen;
        else if (latestDecision.action === "RIGHT") dx = arrowLen;

        ctx.strokeStyle = "#09090b";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(pacPx, pacPy);
        ctx.lineTo(pacPx + dx, pacPy + dy);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = "#09090b";
        ctx.beginPath();
        ctx.arc(pacPx + dx, pacPy + dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Ghosts in Bespoke Monochromatic Styles
    for (const ghost of ghosts) {
      const gx = ghost.x * tileSize + tileSize / 2;
      const gy = ghost.y * tileSize + tileSize / 2;
      const radius = tileSize * 0.40;

      ctx.save();

      if (ghost.mode === "EATEN") {
        // Eaten mode: floating monochrome eyes
        drawGhostEyes(ctx, gx, gy, ghost.direction, tileSize);
      } else if (ghost.mode === "FRIGHTENED") {
        // Frightened mode: hollow dashed outline with blinking inverted eyes
        ctx.strokeStyle = "#52525b";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        drawGhostBody(ctx, gx, gy, radius, false);
        ctx.stroke();
        ctx.setLineDash([]);

        // Scared wavy mouth
        ctx.strokeStyle = "#27272a";
        ctx.beginPath();
        ctx.moveTo(gx - radius * 0.5, gy + 1);
        ctx.lineTo(gx - radius * 0.2, gy - 1);
        ctx.lineTo(gx + radius * 0.1, gy + 1);
        ctx.lineTo(gx + radius * 0.4, gy - 1);
        ctx.stroke();
      } else {
        // Distinct Monochromatic styles per ghost:
        if (ghost.visualStyle === "solid") {
          // Blinky: Solid black body
          ctx.fillStyle = "#09090b";
          drawGhostBody(ctx, gx, gy, radius, true);
        } else if (ghost.visualStyle === "dotted") {
          // Pinky: Charcoal body with light dots
          ctx.fillStyle = "#27272a";
          drawGhostBody(ctx, gx, gy, radius, true);
          ctx.strokeStyle = "#e4e4e7";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (ghost.visualStyle === "striped") {
          // Inky: Deep slate with diagonal stripes
          ctx.fillStyle = "#3f3f46";
          drawGhostBody(ctx, gx, gy, radius, true);
          ctx.strokeStyle = "#fafafa";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx - radius * 0.6, gy - radius * 0.3);
          ctx.lineTo(gx + radius * 0.6, gy + radius * 0.6);
          ctx.moveTo(gx - radius * 0.6, gy + radius * 0.3);
          ctx.lineTo(gx + radius * 0.3, gy + radius * 0.9);
          ctx.stroke();
        } else {
          // Clyde: Muted grey with crosshatch
          ctx.fillStyle = "#52525b";
          drawGhostBody(ctx, gx, gy, radius, true);
          ctx.strokeStyle = "#d4d4d8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx - radius * 0.5, gy);
          ctx.lineTo(gx + radius * 0.5, gy);
          ctx.moveTo(gx, gy - radius * 0.5);
          ctx.lineTo(gx, gy + radius * 0.5);
          ctx.stroke();
        }

        // Draw classic expressive eyes
        drawGhostEyes(ctx, gx, gy, ghost.direction, tileSize);
      }

      ctx.restore();
    }

    // 5. Render Pac-Man (Jet black circle with animated chomping mouth)
    const px = pacman.x * tileSize + tileSize / 2;
    const py = pacman.y * tileSize + tileSize / 2;
    const pacRadius = tileSize * 0.45;

    let baseAngle = 0;
    if (pacman.direction === "RIGHT") baseAngle = 0;
    else if (pacman.direction === "DOWN") baseAngle = Math.PI * 0.5;
    else if (pacman.direction === "LEFT") baseAngle = Math.PI;
    else if (pacman.direction === "UP") baseAngle = Math.PI * 1.5;

    const mouth = pacman.mouthAngle;

    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, pacRadius, baseAngle + mouth, baseAngle + Math.PI * 2 - mouth, false);
    ctx.closePath();
    ctx.fill();

    // Subtle edge highlight
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [mapState, pacman, ghosts, latestDecision, aiVisionOverlay, tileSize]);

  return (
    <div className="relative inline-block rounded-xl border border-neutral-300 bg-white p-2 shadow-md">
      <canvas
        ref={canvasRef}
        style={{
          width: `${COLS * tileSize}px`,
          height: `${ROWS * tileSize}px`,
        }}
        className="block rounded-xl"
      />
    </div>
  );
}

function drawGhostBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: boolean
) {
  ctx.beginPath();
  // Dome top
  ctx.arc(x, y - 1, r, Math.PI, 0, false);
  // Sides and wavy tentacles bottom
  ctx.lineTo(x + r, y + r);
  ctx.lineTo(x + (r * 2) / 3, y + r - 2.5);
  ctx.lineTo(x + r / 3, y + r);
  ctx.lineTo(x, y + r - 2.5);
  ctx.lineTo(x - r / 3, y + r);
  ctx.lineTo(x - (r * 2) / 3, y + r - 2.5);
  ctx.lineTo(x - r, y + r);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
}

function drawGhostEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  tileSize: number
) {
  const eyeOffset = tileSize * 0.08;
  let ox = 0;
  let oy = 0;
  if (dir === "LEFT") ox = -eyeOffset;
  else if (dir === "RIGHT") ox = eyeOffset;
  else if (dir === "UP") oy = -eyeOffset;
  else if (dir === "DOWN") oy = eyeOffset;

  const eyeRadius = tileSize * 0.13;
  const pupilRadius = tileSize * 0.07;
  const eyeDist = tileSize * 0.16;

  // White sclera
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - eyeDist, y - tileSize * 0.12, eyeRadius, 0, Math.PI * 2);
  ctx.arc(x + eyeDist, y - tileSize * 0.12, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Dark pupils
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.arc(x - eyeDist + ox, y - tileSize * 0.12 + oy, pupilRadius, 0, Math.PI * 2);
  ctx.arc(x + eyeDist + ox, y - tileSize * 0.12 + oy, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
}
