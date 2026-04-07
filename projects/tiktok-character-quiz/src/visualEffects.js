// visualEffects.js — Particle systems and animations
// Implements GDD Section 2 animations

export class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.particleConfig = options.particleConfig || {
      color: '#FFFFFF',
      count: 50,
      speed: 2,
      size: 4,
      shape: 'circle'
    };
    this.isActive = false;
  }

  setTheme(theme) {
    this.particleConfig.color = theme.particleColor || '#FFFFFF';
    this.emoji = theme.emoji || 'star';
  }

  start() {
    this.isActive = true;
    this.particles = [];
    // Initial burst
    for (let i = 0; i < this.particleConfig.count; i++) {
      this.particles.push(this.createParticle(true));
    }
    this.animate();
  }

  stop() {
    this.isActive = false;
  }

  createParticle(isBurst = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isBurst
      ? Math.random() * this.particleConfig.speed * 3 + 2
      : Math.random() * this.particleConfig.speed + 0.5;

    return {
      x: isBurst ? this.canvas.width / 2 : Math.random() * this.canvas.width,
      y: isBurst ? this.canvas.height / 2 : Math.random() * this.canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isBurst ? 2 : 0),
      size: Math.random() * this.particleConfig.size + 2,
      alpha: 1,
      decay: isBurst ? 0.015 : 0.003,
      color: this.particleConfig.color,
      emoji: this.emoji
    };
  }

  animate() {
    if (!this.isActive) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Add new ambient particles
    if (Math.random() < 0.3 && this.particles.length < this.particleConfig.count * 2) {
      this.particles.push(this.createParticle(false));
    }

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= p.decay;
      p.size *= 0.995;

      if (p.alpha <= 0 || p.size < 0.5) return false;

      this.drawParticle(p);
      return true;
    });

    if (this.isActive) {
      requestAnimationFrame(() => this.animate());
    }
  }

  drawParticle(p) {
    this.ctx.save();
    this.ctx.globalAlpha = p.alpha;

    if (p.emoji && Math.random() > 0.7) {
      // Draw emoji sometimes
      this.ctx.font = `${p.size * 4}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const emojis = { fire: '🔥', sparkle: '✨', cloud: '☁️', star: '⭐' };
      this.ctx.fillText(emojis[p.emoji] || '✨', p.x, p.y);
    } else {
      // Draw circle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  burst() {
    // Extra burst on result reveal
    for (let i = 0; i < this.particleConfig.count * 2; i++) {
      this.particles.push(this.createParticle(true));
    }
  }
}

// Animation utilities
export function animateScalePulse(element, duration = 200) {
  element.style.transition = `transform ${duration}ms ease-out`;
  element.style.transform = 'scale(1)';
  requestAnimationFrame(() => {
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration / 2);
  });
}

export function animateShake(element, duration = 300) {
  let startTime = Date.now();
  const originalX = 0;

  function shake() {
    const elapsed = Date.now() - startTime;
    if (elapsed >= duration) {
      element.style.transform = `translateX(0px)`;
      return;
    }
    const offset = Math.sin(elapsed * 0.05) * 8 * (1 - elapsed / duration);
    element.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(shake);
  }
  shake();
}

export function animateSlideIn(element, direction = 'left', duration = 300) {
  const translateMap = { left: '-100%', right: '100%', up: '-100%', down: '100%' };
  element.style.transition = 'none';
  element.style.transform = `translateX(${direction === 'left' || direction === 'right' ? translateMap[direction] : '0'}) translateY(${direction === 'up' || direction === 'down' ? translateMap[direction] : '0'})`;
  element.style.opacity = '0';

  requestAnimationFrame(() => {
    element.style.transition = `all ${duration}ms ease-out`;
    element.style.transform = 'translateX(0) translateY(0)';
    element.style.opacity = '1';
  });
}

export function animateFadeIn(element, duration = 300) {
  element.style.opacity = '0';
  requestAnimationFrame(() => {
    element.style.transition = `opacity ${duration}ms ease-out`;
    element.style.opacity = '1';
  });
}

export function animateCinematicReveal(element, duration = 1500) {
  // Zoom + glow effect for result reveal
  element.style.transition = 'none';
  element.style.transform = 'scale(0.3)';
  element.style.opacity = '0';
  element.style.filter = 'blur(20px)';

  requestAnimationFrame(() => {
    element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
    element.style.filter = 'blur(0px)';
  });
}
