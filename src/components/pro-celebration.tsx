"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "star";
  life: number;
}

const COLORS = [
  "#39AB54", "#2A8040", "#7FD99A", "#C8EDCF",
  "#F5D03B", "#F7E07A", "#ffffff", "#a8f5c0",
];

function createParticle(canvas: HTMLCanvasElement): Particle {
  const shapes: Particle["shape"][] = ["rect", "circle", "star"];
  return {
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    size: Math.random() * 10 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    opacity: 1,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    life: 1,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerX = x + r * Math.cos((i * 4 * Math.PI) / 5 - Math.PI / 2);
    const outerY = y + r * Math.sin((i * 4 * Math.PI) / 5 - Math.PI / 2);
    const innerX = x + (r / 2) * Math.cos(((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2);
    const innerY = y + (r / 2) * Math.sin(((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2);
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
}

interface ProCelebrationProps {
  onDone: () => void;
}

export function ProCelebration({ onDone }: ProCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    let frame = 0;
    let raf: number;
    const BURST_FRAMES = 80; // emit for ~1.3s
    const TOTAL_FRAMES = 240; // run for ~4s total

    function emit() {
      for (let i = 0; i < 6; i++) {
        particles.push(createParticle(canvas!));
      }
    }

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (frame < BURST_FRAMES) emit();
      frame++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.rotation += p.rotationSpeed;
        p.life -= 1 / TOTAL_FRAMES;
        p.opacity = Math.max(0, p.life * 1.5);

        if (p.y > canvas!.height + 20 || p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);

        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          drawStar(ctx!, 0, 0, p.size / 2);
          ctx!.fill();
        }
        ctx!.restore();
      }

      if (frame < TOTAL_FRAMES || particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}
