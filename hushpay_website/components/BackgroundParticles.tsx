import React, { useEffect, useRef } from 'react';

export const BackgroundParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Retro square particles
    const particles: { x: number; y: number; size: number; color: string; speedY: number; speedX: number; opacity: number }[] = [];
    
    // Matrix/Hacker Green colors
    const colors = ['#22c55e', '#15803d', '#4ade80', '#166534'];

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.floor(Math.random() * 4 + 2), // Larger, integer sizes
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: (Math.random() - 0.5) * 0.2, // Slower movement
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.1
      };
    };

    // Initialize
    for (let i = 0; i < 60; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        // Draw squares instead of circles
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around screen
        if (p.y > height) p.y = 0;
        if (p.y < 0) p.y = height;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-50" />;
};