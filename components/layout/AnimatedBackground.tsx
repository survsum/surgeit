'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 }); // normalized 0-1
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const isDark = () => document.documentElement.classList.contains('dark');

    // ── Mouse tracking (normalized) ─────────────────────────────
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / W, y: e.clientY / H };
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      buildMountains();
    };
    window.addEventListener('resize', onResize);

    // ── Snowflake ───────────────────────────────────────────────
    interface Flake {
      x: number; y: number; r: number; speed: number;
      drift: number; phase: number; opacity: number;
      layer: number; // 0=far,1=mid,2=near — parallax depth
    }

    const FLAKE_COUNT = 200;
    const flakes: Flake[] = [];

    function makeFlake(startAtTop = false): Flake {
      const layer = Math.floor(Math.random() * 3);
      return {
        x: Math.random() * W,
        y: startAtTop ? -10 - Math.random() * H : Math.random() * H,
        r: layer === 0 ? 0.8 + Math.random() * 1.2
         : layer === 1 ? 1.5 + Math.random() * 2
         :               2.5 + Math.random() * 3,
        speed: layer === 0 ? 0.3 + Math.random() * 0.4
             : layer === 1 ? 0.6 + Math.random() * 0.6
             :               1.0 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        opacity: layer === 0 ? 0.25 + Math.random() * 0.3
               : layer === 1 ? 0.4 + Math.random() * 0.35
               :               0.6 + Math.random() * 0.3,
        layer,
      };
    }

    for (let i = 0; i < FLAKE_COUNT; i++) flakes.push(makeFlake(false));

    // ── Mountain layers ─────────────────────────────────────────
    interface MountainLayer {
      points: { x: number; y: number }[];
      fillDark: string;
      fillLight: string;
      snowFillDark: string;
      snowFillLight: string;
      parallaxX: number; // how much it shifts with mouse
      parallaxY: number;
      yBase: number;    // base Y position (fraction of H)
    }

    let mountains: MountainLayer[] = [];

    function makeMountainPoints(
      count: number,
      yBase: number,
      yRange: number,
      roughness: number
    ): { x: number; y: number }[] {
      const pts: { x: number; y: number }[] = [];
      const step = W / (count - 1);
      for (let i = 0; i < count; i++) {
        const x = i * step;
        let y: number;
        if (i === 0 || i === count - 1) {
          y = H; // ground level edges
        } else {
          // Create sharp peaks
          const t = i / (count - 1);
          const base = yBase * H;
          const wave = Math.sin(t * Math.PI * (2 + Math.random())) * yRange * H;
          y = base - Math.abs(wave) + (Math.random() - 0.3) * roughness * H;
          y = Math.max(base - yRange * H * 1.2, Math.min(base + 20, y));
        }
        pts.push({ x, y });
      }
      return pts;
    }

    function buildMountains() {
      mountains = [
        // Layer 0 — farthest, tallest, most blue-grey
        {
          points: makeMountainPoints(14, 0.52, 0.28, 0.04),
          fillDark: '#1a2535', fillLight: '#8aa4c8',
          snowFillDark: 'rgba(200,215,235,0.55)', snowFillLight: 'rgba(255,255,255,0.85)',
          parallaxX: 12, parallaxY: 6, yBase: 0.52,
        },
        // Layer 1 — mid, medium height, darker
        {
          points: makeMountainPoints(10, 0.62, 0.22, 0.03),
          fillDark: '#111c2a', fillLight: '#5a7ba4',
          snowFillDark: 'rgba(180,200,225,0.6)', snowFillLight: 'rgba(255,255,255,0.9)',
          parallaxX: 22, parallaxY: 10, yBase: 0.62,
        },
        // Layer 2 — foreground, lowest peaks, darkest
        {
          points: makeMountainPoints(8, 0.72, 0.18, 0.025),
          fillDark: '#0a1320', fillLight: '#3a5a80',
          snowFillDark: 'rgba(220,235,255,0.7)', snowFillLight: 'rgba(255,255,255,0.95)',
          parallaxX: 36, parallaxY: 14, yBase: 0.72,
        },
        // Layer 3 — very foreground ground hills
        {
          points: makeMountainPoints(6, 0.82, 0.08, 0.015),
          fillDark: '#070e1a', fillLight: '#2a4060',
          snowFillDark: 'rgba(230,242,255,0.8)', snowFillLight: 'rgba(255,255,255,1)',
          parallaxX: 50, parallaxY: 18, yBase: 0.82,
        },
      ];
    }
    buildMountains();

    // ── Draw one mountain layer ─────────────────────────────────
    function drawMountain(layer: MountainLayer, mx: number, my: number, dark: boolean) {
      const ox = (mx - 0.5) * layer.parallaxX;
      const oy = (my - 0.5) * layer.parallaxY;
      const pts = layer.points;

      ctx.save();
      ctx.translate(ox, oy);

      // Mountain body
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }
      ctx.lineTo(W + 60, H + 60);
      ctx.lineTo(-60, H + 60);
      ctx.closePath();
      ctx.fillStyle = dark ? layer.fillDark : layer.fillLight;
      ctx.fill();

      // Snow caps — find peaks (local minima in Y = highest points)
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const prev = pts[i - 1];
        const next = pts[i + 1];
        // Is this a peak?
        if (p.y < prev.y && p.y < next.y) {
          const peakH = (prev.y + next.y) / 2 - p.y;
          const snowDepth = Math.min(peakH * 0.55, 60);

          ctx.beginPath();
          ctx.moveTo(prev.x + (p.x - prev.x) * 0.35, p.y + snowDepth * 0.8);
          ctx.bezierCurveTo(
            p.x - 30, p.y + snowDepth * 0.3,
            p.x - 10, p.y - 8,
            p.x, p.y - 4
          );
          ctx.bezierCurveTo(
            p.x + 10, p.y - 8,
            p.x + 30, p.y + snowDepth * 0.3,
            next.x - (next.x - p.x) * 0.35, p.y + snowDepth * 0.8
          );
          ctx.closePath();
          const snowGrad = ctx.createLinearGradient(p.x, p.y - 10, p.x, p.y + snowDepth);
          snowGrad.addColorStop(0, dark ? 'rgba(230,245,255,0.95)' : 'rgba(255,255,255,1)');
          snowGrad.addColorStop(1, dark ? 'rgba(200,220,240,0)' : 'rgba(240,248,255,0)');
          ctx.fillStyle = snowGrad;
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // ── Sky gradient ────────────────────────────────────────────
    function drawSky(dark: boolean, solidify: number) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      if (dark) {
        // Night sky — deep navy to dark teal
        skyGrad.addColorStop(0, '#020c1a');
        skyGrad.addColorStop(0.4, '#051830');
        skyGrad.addColorStop(0.7, '#0a2240');
        skyGrad.addColorStop(1, '#0d1f35');
      } else {
        // Day sky — pale blue to white horizon
        skyGrad.addColorStop(0, '#b8d4f0');
        skyGrad.addColorStop(0.4, '#d4e8f8');
        skyGrad.addColorStop(0.75, '#eaf4ff');
        skyGrad.addColorStop(1, '#f5faff');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Stars (dark mode only) ──────────────────────────────────
    const stars: { x: number; y: number; r: number; twinkle: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H * 0.6,
        r: Math.random() * 1.2, twinkle: Math.random() * Math.PI * 2,
      });
    }

    function drawStars(t: number, dark: boolean) {
      if (!dark) return;
      ctx.save();
      stars.forEach(s => {
        const alpha = 0.3 + Math.sin(t * 0.8 + s.twinkle) * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,235,255,${alpha})`;
        ctx.fill();
      });
      ctx.restore();
    }

    // ── Ground snow ─────────────────────────────────────────────
    function drawGround(mx: number, my: number, dark: boolean) {
      const ox = (mx - 0.5) * 55;
      const oy = (my - 0.5) * 20;
      ctx.save();
      ctx.translate(ox, oy);

      // Snow ground gradient
      const groundGrad = ctx.createLinearGradient(0, H * 0.85, 0, H);
      groundGrad.addColorStop(0, dark ? 'rgba(180,210,240,0.9)' : 'rgba(240,250,255,1)');
      groundGrad.addColorStop(1, dark ? 'rgba(150,190,225,1)' : 'rgba(220,240,255,1)');
      ctx.fillStyle = groundGrad;

      ctx.beginPath();
      ctx.moveTo(-60, H * 0.88);
      ctx.bezierCurveTo(W * 0.2, H * 0.82, W * 0.5, H * 0.85, W * 0.8, H * 0.83);
      ctx.bezierCurveTo(W, H * 0.84, W + 30, H * 0.86, W + 60, H * 0.88);
      ctx.lineTo(W + 60, H + 60);
      ctx.lineTo(-60, H + 60);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // ── Moon / Sun ──────────────────────────────────────────────
    function drawCelestial(dark: boolean) {
      if (dark) {
        // Moon
        const mx2 = W * 0.82, my2 = H * 0.12;
        const moonGrad = ctx.createRadialGradient(mx2, my2, 0, mx2, my2, 40);
        moonGrad.addColorStop(0, 'rgba(240,248,255,0.95)');
        moonGrad.addColorStop(0.6, 'rgba(200,225,250,0.6)');
        moonGrad.addColorStop(1, 'rgba(180,210,240,0)');
        ctx.beginPath();
        ctx.arc(mx2, my2, 40, 0, Math.PI * 2);
        ctx.fillStyle = moonGrad;
        ctx.fill();
        // Moon glow
        const glowGrad = ctx.createRadialGradient(mx2, my2, 30, mx2, my2, 100);
        glowGrad.addColorStop(0, 'rgba(180,210,255,0.12)');
        glowGrad.addColorStop(1, 'rgba(180,210,255,0)');
        ctx.beginPath();
        ctx.arc(mx2, my2, 100, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      } else {
        // Sun
        const sx = W * 0.78, sy = H * 0.14;
        const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 55);
        sunGrad.addColorStop(0, 'rgba(255,248,210,1)');
        sunGrad.addColorStop(0.5, 'rgba(255,230,140,0.8)');
        sunGrad.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.beginPath();
        ctx.arc(sx, sy, 55, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();
        // Rays glow
        const rayGrad = ctx.createRadialGradient(sx, sy, 40, sx, sy, 140);
        rayGrad.addColorStop(0, 'rgba(255,240,160,0.2)');
        rayGrad.addColorStop(1, 'rgba(255,240,160,0)');
        ctx.beginPath();
        ctx.arc(sx, sy, 140, 0, Math.PI * 2);
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
    }

    // ── Aurora (dark mode) ──────────────────────────────────────
    function drawAurora(t: number, dark: boolean) {
      if (!dark) return;
      ctx.save();
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 3; i++) {
        const aGrad = ctx.createLinearGradient(0, H * 0.05, 0, H * 0.45);
        const hues = [160, 180, 200];
        aGrad.addColorStop(0, `hsla(${hues[i]},80%,60%,0)`);
        aGrad.addColorStop(0.4, `hsla(${hues[i]},80%,55%,0.8)`);
        aGrad.addColorStop(1, `hsla(${hues[i]},80%,50%,0)`);
        ctx.beginPath();
        const offset = Math.sin(t * 0.3 + i * 2) * 80;
        ctx.moveTo(-50 + offset, H * 0.05);
        ctx.bezierCurveTo(
          W * 0.3 + offset, H * 0.08 + Math.sin(t * 0.2 + i) * 30,
          W * 0.6 + offset, H * 0.12 + Math.cos(t * 0.25 + i) * 25,
          W + 50 + offset, H * 0.06
        );
        ctx.lineTo(W + 50 + offset + 40, H * 0.45);
        ctx.bezierCurveTo(
          W * 0.65 + offset, H * 0.42, W * 0.35 + offset, H * 0.38, -50 + offset - 40, H * 0.44
        );
        ctx.closePath();
        ctx.fillStyle = aGrad;
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Floating snow mist ──────────────────────────────────────
    function drawMist(dark: boolean) {
      const mistGrad = ctx.createLinearGradient(0, H * 0.75, 0, H);
      if (dark) {
        mistGrad.addColorStop(0, 'rgba(100,150,200,0)');
        mistGrad.addColorStop(0.5, 'rgba(120,170,220,0.12)');
        mistGrad.addColorStop(1, 'rgba(140,190,235,0.25)');
      } else {
        mistGrad.addColorStop(0, 'rgba(230,245,255,0)');
        mistGrad.addColorStop(0.5, 'rgba(240,250,255,0.35)');
        mistGrad.addColorStop(1, 'rgba(250,252,255,0.7)');
      }
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Main draw loop ──────────────────────────────────────────
    let t = 0;
    // Smooth mouse interpolation
    const smoothMouse = { x: 0.5, y: 0.5 };

    const draw = () => {
      t += 0.007;
      ctx.clearRect(0, 0, W, H);

      const dark = isDark();
      const scroll = scrollRef.current;
      const solidify = Math.min(1, scroll / 700);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Smooth mouse follow
      smoothMouse.x += (mx - smoothMouse.x) * 0.05;
      smoothMouse.y += (my - smoothMouse.y) * 0.05;

      if (solidify < 1) {
        const fade = 1 - solidify;

        // Sky
        drawSky(dark, solidify);

        ctx.save();
        ctx.globalAlpha = fade;

        // Stars / aurora (dark only)
        drawStars(t, dark);
        drawAurora(t, dark);

        // Celestial body
        drawCelestial(dark);

        // Mountain layers (back to front)
        mountains.forEach(m => drawMountain(m, smoothMouse.x, smoothMouse.y, dark));

        // Ground snow
        drawGround(smoothMouse.x, smoothMouse.y, dark);

        // Mist
        drawMist(dark);

        // ── Snowflakes ──────────────────────────────────────────
        flakes.forEach(f => {
          // Parallax: near flakes shift more with mouse
          const pxStrength = f.layer === 0 ? 8 : f.layer === 1 ? 18 : 30;
          const parallaxX = (smoothMouse.x - 0.5) * pxStrength;
          const parallaxY = (smoothMouse.y - 0.5) * pxStrength * 0.4;

          // Move flake
          f.y += f.speed;
          f.x += f.drift + Math.sin(t * 0.6 + f.phase) * 0.35;

          // Reset if off screen
          if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
          if (f.x > W + 20) f.x = -10;
          if (f.x < -20) f.x = W + 10;

          const drawX = f.x + parallaxX;
          const drawY = f.y + parallaxY;

          // Draw flake
          ctx.save();
          ctx.globalAlpha = f.opacity * fade;
          ctx.beginPath();
          ctx.arc(drawX, drawY, f.r, 0, Math.PI * 2);
          ctx.fillStyle = dark ? 'rgba(200,225,255,0.9)' : 'rgba(255,255,255,0.95)';
          ctx.fill();

          // Glow on larger flakes
          if (f.r > 2) {
            const flakeGlow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, f.r * 2.5);
            flakeGlow.addColorStop(0, dark ? 'rgba(180,215,255,0.3)' : 'rgba(255,255,255,0.4)');
            flakeGlow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(drawX, drawY, f.r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = flakeGlow;
            ctx.fill();
          }
          ctx.restore();
        });

        ctx.restore(); // globalAlpha fade
      } else {
        // Fully solid — just draw the bg color
        ctx.fillStyle = dark ? '#0d0d0d' : '#fafaf8';
        ctx.fillRect(0, 0, W, H);
      }

      // Solidify overlay
      if (solidify > 0 && solidify < 1) {
        ctx.fillStyle = dark ? '#0d0d0d' : '#fafaf8';
        ctx.globalAlpha = solidify;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
