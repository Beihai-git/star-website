/**
 * Snake Game Engine — Core game logic
 * 贪吃蛇游戏引擎 — 核心游戏逻辑
 *
 * Features:
 * - requestAnimationFrame game loop with fixed-tick updates
 * - Input queue for responsive controls
 * - Particle system for visual effects
 * - Combo system (eat quickly = multiplier)
 * - 3 game modes: Classic, Time Attack, Maze
 * - Screen shake effect
 * - Theme-aware rendering
 */

class SnakeGame {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Grid configuration
    this.gridSize = options.gridSize || 20;
    this.tileCount = 0; // Calculated from canvas size

    // Game speed (ms per tick)
    this.baseSpeed = options.speed || 150;
    this.speed = this.baseSpeed;

    // Game state
    this.snake = [];
    this.food = null;
    this.obstacles = []; // For Maze mode
    this.direction = { x: 1, y: 0 };
    this.directionQueue = [];
    this.score = 0;
    this.highScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastEatTime = 0;
    this.comboWindow = 1500; // ms

    // Game mode
    this.mode = options.mode || 'classic'; // 'classic' | 'timeAttack' | 'maze'
    this.timeLeft = 60; // For timeAttack mode
    this.timeTimer = null;

    // Game running state
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;

    // Animation
    this.animFrameId = null;
    this.lastTickTime = 0;
    this.tickAccumulator = 0;

    // Particles
    this.particles = [];

    // Screen shake
    this.shakeAmount = 0;
    this.shakeDecay = 0.85;

    // Theme
    this.currentThemeId = options.theme || 'classic-green';

    // High score (loaded from localStorage)
    this.highScore = parseInt(localStorage.getItem('snakeHighScoreV2')) || 0;

    // Callbacks
    this.onScoreChange = options.onScoreChange || (() => {});
    this.onHighScoreChange = options.onHighScoreChange || (() => {});
    this.onComboChange = options.onComboChange || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onEat = options.onEat || (() => {});
    this.onTimeUpdate = options.onTimeUpdate || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Calculate tile count based on canvas size
    this._calculateGrid();

    // Initial draw
    this._draw();
  }

  // ========== PUBLIC API ==========

  /** Start a new game */
  start() {
    this._cleanup();
    this._initSnake();
    this._generateFood();
    this.obstacles = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastEatTime = 0;
    this.speed = this.baseSpeed;
    this.shakeAmount = 0;
    this.particles = [];
    this.direction = { x: 1, y: 0 };
    this.directionQueue = [];
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;

    // Mode-specific setup
    if (this.mode === 'maze') {
      this._generateObstacles();
    }
    if (this.mode === 'timeAttack') {
      this.timeLeft = 60;
      this._startTimeTimer();
      this.onTimeUpdate(this.timeLeft);
    }

    // Sync state
    this.onScoreChange(this.score);
    this.onComboChange(0);
    this.onStateChange('playing');

    // Start game loop
    this.lastTickTime = performance.now();
    this.tickAccumulator = 0;
    this._loop(this.lastTickTime);
  }

  /** Pause the game */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.timeTimer) clearInterval(this.timeTimer);
    this.onStateChange('paused');
  }

  /** Resume the game */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTickTime = performance.now();
    this.tickAccumulator = 0;
    if (this.mode === 'timeAttack') this._startTimeTimer();
    this.onStateChange('playing');
    this._loop(this.lastTickTime);
  }

  /** Restart game */
  restart() {
    this.start();
  }

  /** Change direction (called by input handler) */
  setDirection(dx, dy) {
    // Prevent 180-degree turns by checking against the NEXT direction
    // (which might still be in the queue)
    const nextDir = this.directionQueue.length > 0
      ? this.directionQueue[this.directionQueue.length - 1]
      : this.direction;

    // Reject opposite directions
    if (dx === -nextDir.x && dy === -nextDir.y) return;
    // Reject same direction (no-op)
    if (dx === nextDir.x && dy === nextDir.y) return;

    // Queue the direction (max 3 queued to prevent exploit)
    if (this.directionQueue.length < 3) {
      this.directionQueue.push({ x: dx, y: dy });
    }
  }

  /** Set game mode */
  setMode(mode) {
    this.mode = mode;
  }

  /** Set theme */
  setTheme(themeId) {
    this.currentThemeId = themeId;
    if (!this.isRunning) {
      this._draw();
    }
  }

  /** Set speed */
  setSpeed(speed) {
    this.baseSpeed = speed;
    this.speed = speed;
  }

  /** Set grid size */
  setGridSize(size) {
    this.gridSize = size;
    this._calculateGrid();
    if (!this.isRunning) {
      this._draw();
    }
  }

  /** Get current score */
  getScore() {
    return this.score;
  }

  /** Get high score */
  getHighScore() {
    return this.highScore;
  }

  /** Get current combo */
  getCombo() {
    return this.combo;
  }

  /** Get game state */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      mode: this.mode,
      score: this.score,
      highScore: this.highScore,
      combo: this.combo,
    };
  }

  /** Clean up all resources */
  destroy() {
    this._cleanup();
    if (this.timeTimer) clearInterval(this.timeTimer);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  // ========== PRIVATE: INITIALIZATION ==========

  _calculateGrid() {
    this.tileCount = Math.floor(Math.min(this.canvas.width, this.canvas.height) / this.gridSize);
  }

  _initSnake() {
    const mid = Math.floor(this.tileCount / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
  }

  _generateFood() {
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 1000) {
      const candidate = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount),
      };
      // Not on snake
      const onSnake = this.snake.some(s => s.x === candidate.x && s.y === candidate.y);
      // Not on obstacle
      const onObstacle = this.obstacles.some(o => o.x === candidate.x && o.y === candidate.y);
      if (!onSnake && !onObstacle) {
        this.food = candidate;
        valid = true;
      }
      attempts++;
    }
    if (!valid) {
      // Fallback: scan all tiles
      for (let x = 0; x < this.tileCount; x++) {
        for (let y = 0; y < this.tileCount; y++) {
          const onSnake = this.snake.some(s => s.x === x && s.y === y);
          const onObstacle = this.obstacles.some(o => o.x === x && o.y === y);
          if (!onSnake && !onObstacle) {
            this.food = { x, y };
            return;
          }
        }
      }
    }
  }

  _generateObstacles() {
    this.obstacles = [];
    const numObstacles = Math.floor(this.tileCount * 0.6); // 60% of tiles as walls
    const mid = Math.floor(this.tileCount / 2);
    const safeZone = 3; // Keep center area clear for snake spawn

    for (let i = 0; i < numObstacles; i++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        const candidate = {
          x: Math.floor(Math.random() * this.tileCount),
          y: Math.floor(Math.random() * this.tileCount),
        };
        // Keep center clear
        if (Math.abs(candidate.x - mid) < safeZone && Math.abs(candidate.y - mid) < safeZone) {
          attempts++;
          continue;
        }
        // Don't duplicate
        if (this.obstacles.some(o => o.x === candidate.x && o.y === candidate.y)) {
          attempts++;
          continue;
        }
        // Place small clusters (2-3 adjacent obstacles)
        this.obstacles.push(candidate);
        if (Math.random() < 0.4 && this.obstacles.length < numObstacles) {
          const dx = Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0;
          const dy = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
          const neighbor = { x: candidate.x + dx, y: candidate.y + dy };
          if (neighbor.x >= 0 && neighbor.x < this.tileCount &&
              neighbor.y >= 0 && neighbor.y < this.tileCount &&
              !this.obstacles.some(o => o.x === neighbor.x && o.y === neighbor.y)) {
            this.obstacles.push(neighbor);
            i++; // Count the extra obstacle
          }
        }
        placed = true;
        attempts++;
      }
    }
  }

  // ========== PRIVATE: GAME LOOP ==========

  _loop(timestamp) {
    if (!this.isRunning) return;
    if (this.isPaused) return;

    this.animFrameId = requestAnimationFrame((t) => this._loop(t));

    const delta = timestamp - this.lastTickTime;
    this.lastTickTime = timestamp;
    this.tickAccumulator += delta;

    // Update particles every frame (smooth animation)
    this._updateParticles(delta);

    // Update game state at fixed tick rate
    while (this.tickAccumulator >= this.speed) {
      this.tickAccumulator -= this.speed;
      this._tick();
      if (this.isGameOver) return; // Stop if game ended during tick
    }

    // Always render at display refresh rate
    this._draw();
  }

  _tick() {
    // Process input queue
    if (this.directionQueue.length > 0) {
      this.direction = this.directionQueue.shift();
    }

    // Move snake
    const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this._die();
      return;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this._die();
      return;
    }

    // Obstacle collision (Maze mode)
    if (this.mode === 'maze' && this.obstacles.some(o => o.x === head.x && o.y === head.y)) {
      this._die();
      return;
    }

    // Add head
    this.snake.unshift(head);

    // Check food
    if (head.x === this.food.x && head.y === this.food.y) {
      this._eat();
    } else {
      this.snake.pop();
    }
  }

  _eat() {
    const now = performance.now();

    // Combo system
    if (now - this.lastEatTime < this.comboWindow) {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    } else {
      this.combo = 0;
    }
    this.lastEatTime = now;

    // Score with combo multiplier
    const points = 10 * (1 + this.combo);
    this.score += points;
    this.onScoreChange(this.score);

    // Combo callback
    if (this.combo > 0) {
      this.onComboChange(this.combo);
    }

    // Eat callback (for particles, sound, etc.)
    this.onEat({
      x: this.food.x,
      y: this.food.y,
      combo: this.combo,
      points: points,
    });

    // Spawn particles at food location
    this._spawnFoodParticles(this.food.x, this.food.y);

    // Speed up slightly
    if (this.speed > 50) {
      this.speed = Math.max(50, this.speed - 2);
    }

    // Generate new food
    this._generateFood();
  }

  _die() {
    this.isRunning = false;
    this.isGameOver = true;
    this.shakeAmount = 8; // Screen shake on death

    if (this.timeTimer) clearInterval(this.timeTimer);

    // Check high score
    let isNewHighScore = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      isNewHighScore = true;
      localStorage.setItem('snakeHighScoreV2', this.highScore.toString());
      this.onHighScoreChange(this.highScore);
    }

    this.onGameOver({
      score: this.score,
      highScore: this.highScore,
      isNewHighScore,
      maxCombo: this.maxCombo,
      mode: this.mode,
    });
    this.onStateChange('gameover');

    // One final render to show death position + shake
    this._draw();

    // After shake, do a clean draw
    setTimeout(() => {
      this.shakeAmount = 0;
      this._draw();
    }, 500);
  }

  // ========== PRIVATE: TIMER ==========

  _startTimeTimer() {
    if (this.timeTimer) clearInterval(this.timeTimer);
    this.timeTimer = setInterval(() => {
      if (this.isPaused || !this.isRunning) return;
      this.timeLeft--;
      this.onTimeUpdate(this.timeLeft);
      if (this.timeLeft <= 0) {
        this._die(); // Time's up = death (but keep score)
      }
    }, 1000);
  }

  // ========== PRIVATE: PARTICLES ==========

  _spawnFoodParticles(gx, gy) {
    const cx = gx * this.gridSize + this.gridSize / 2;
    const cy = gy * this.gridSize + this.gridSize / 2;
    const colors = getThemeById(this.currentThemeId).colors;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 3,
        color: colors.particle || '#4ade80',
      });
    }
  }

  _updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ========== PRIVATE: RENDERING ==========

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const colors = getThemeById(this.currentThemeId).colors;

    // Apply screen shake
    ctx.save();
    if (this.shakeAmount > 0.01) {
      const sx = (Math.random() - 0.5) * this.shakeAmount * 2;
      const sy = (Math.random() - 0.5) * this.shakeAmount * 2;
      ctx.translate(sx, sy);
      this.shakeAmount *= this.shakeDecay;
    }

    // Clear
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-10, -10, w + 20, h + 20);

    // Draw grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.tileCount; i++) {
      const pos = i * this.gridSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, this.tileCount * this.gridSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(this.tileCount * this.gridSize, pos);
      ctx.stroke();
    }

    // Draw obstacles (Maze mode)
    if (this.obstacles.length > 0) {
      ctx.fillStyle = colors.obstacle;
      for (const o of this.obstacles) {
        ctx.fillRect(
          o.x * this.gridSize + 2,
          o.y * this.gridSize + 2,
          this.gridSize - 4,
          this.gridSize - 4
        );
      }
    }

    // Draw food with glow
    if (this.food) {
      const fx = this.food.x * this.gridSize + this.gridSize / 2;
      const fy = this.food.y * this.gridSize + this.gridSize / 2;
      const fr = (this.gridSize - 4) / 2;

      // Glow
      ctx.save();
      ctx.shadowColor = colors.foodGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = colors.food;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw snake
    const premium = licenseManager.isPremium();
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const sx = seg.x * this.gridSize;
      const sy = seg.y * this.gridSize;
      const pad = 1;
      const segSize = this.gridSize - pad * 2;

      if (i === 0) {
        // Head — solid color
        ctx.fillStyle = colors.snakeHead;
        ctx.fillRect(sx + pad, sy + pad, segSize, segSize);

        // Head glow (premium only: gold trail)
        if (premium && this.isRunning) {
          ctx.save();
          ctx.shadowColor = colors.accent;
          ctx.shadowBlur = 8;
          ctx.fillStyle = colors.snakeHead;
          ctx.fillRect(sx + pad, sy + pad, segSize, segSize);
          ctx.restore();
        }
      } else {
        // Body — gradient fade
        const alpha = Math.max(0.2, 1 - (i / Math.max(this.snake.length, 1)) * 0.8);
        ctx.fillStyle = colors.snakeBody.replace('{alpha}', alpha.toFixed(2));
        ctx.fillRect(sx + pad, sy + pad, segSize, segSize);
      }

      // Segment border (rounded effect via stroke)
      ctx.strokeStyle = colors.snakeStroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + pad, sy + pad, segSize, segSize);
    }

    // Draw particles (on top)
    for (const p of this.particles) {
      const alpha = p.life;
      ctx.fillStyle = p.color.replace('{alpha}', alpha.toFixed(2))
        || p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw pause overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ ' + (currentLang === 'zh' ? '已暂停' : 'PAUSED'), w / 2, h / 2);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }

  /** Draw a static frame (for idle state before game starts) */
  _drawStatic() {
    this._draw();
  }

  _cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
      this.timeTimer = null;
    }
  }
}
