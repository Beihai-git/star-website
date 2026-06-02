/**
 * UI Manager — Connects game engine to DOM
 * UI 管理器 — 连接游戏引擎与页面元素
 *
 * Handles: modals, panels, language switching, theme switching,
 * mobile touch controls, ad visibility, settings, license input
 */

class UIManager {
  /**
   * @param {SnakeGame} game
   */
  constructor(game) {
    this.game = game;

    // Cache DOM references
    this._cacheDom();

    // Current selections
    this.currentThemeId = 'classic-green';
    this.currentMode = 'classic';

    // Touch/swipe state
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchStartTime = 0;
    this._dpadVisible = window.innerWidth < 800;

    // PWA install prompt
    this._deferredPrompt = null;

    // Init
    this._bindEvents();
    this._updateAllText();
    this._renderThemeCards();
    this._checkPremiumState();
    this._initDpad();
    this._initPwa();

    // Init payment
    payment.initLemonJs();
  }

  // ========== DOM CACHE ==========

  _cacheDom() {
    // Elements with data-i18n attribute
    this._i18nElements = document.querySelectorAll('[data-i18n]');

    // Score elements
    this.$score = document.getElementById('score');
    this.$highScore = document.getElementById('highScore');
    this.$combo = document.getElementById('combo');
    this.$comboContainer = document.getElementById('comboContainer');

    // Timer (time attack mode)
    this.$timer = document.getElementById('timer');
    this.$timerContainer = document.getElementById('timerContainer');

    // Buttons
    this.$btnPlay = document.getElementById('btnPlay');
    this.$btnPause = document.getElementById('btnPause');
    this.$btnRestart = document.getElementById('btnRestart');
    this.$btnSettings = document.getElementById('btnSettings');

    // Game over overlay
    this.$gameOverOverlay = document.getElementById('gameOverOverlay');
    this.$gameOverTitle = document.getElementById('gameOverTitle');
    this.$finalScore = document.getElementById('finalScore');
    this.$newHighScore = document.getElementById('newHighScore');
    this.$btnPlayAgain = document.getElementById('btnPlayAgain');

    // Modals
    this.$settingsModal = document.getElementById('settingsModal');
    this.$premiumModal = document.getElementById('premiumModal');
    this.$licenseModal = document.getElementById('licenseModal');
    this.$licenseInput = document.getElementById('licenseInput');
    this.$licenseMsg = document.getElementById('licenseMsg');
    this.$btnActivate = document.getElementById('btnActivate');

    // Settings controls
    this.$speedSelect = document.getElementById('speedSelect');
    this.$gridSelect = document.getElementById('gridSelect');
    this.$soundToggle = document.getElementById('soundToggle');
    this.$dpadToggle = document.getElementById('dpadToggle');
    this.$langToggle = document.getElementById('langToggle');

    // Premium elements
    this.$premiumBadge = document.getElementById('premiumBadge');
    this.$premiumFeatures = document.getElementById('premiumFeaturesSidebar');
    this.$btnUpgrade = document.getElementById('btnUpgrade');
    this.$adBanner = document.getElementById('adBanner');

    // Theme cards container
    this.$themeCards = document.getElementById('themeCards');

    // Mode buttons
    this.$modeClassic = document.getElementById('modeClassic');
    this.$modeTimeAttack = document.getElementById('modeTimeAttack');
    this.$modeMaze = document.getElementById('modeMaze');

    // D-Pad
    this.$dpad = document.getElementById('dpad');
    this.$dpadUp = document.getElementById('dpadUp');
    this.$dpadDown = document.getElementById('dpadDown');
    this.$dpadLeft = document.getElementById('dpadLeft');
    this.$dpadRight = document.getElementById('dpadRight');

    // Canvas (for touch)
    this.$canvas = document.getElementById('gameCanvas');
  }

  // ========== EVENT BINDING ==========

  _bindEvents() {
    // Play/Pause/Restart
    this.$btnPlay.addEventListener('click', () => {
      audio.playClick();
      this._startGame();
    });
    this.$btnPause.addEventListener('click', () => {
      audio.playClick();
      if (this.game.isPaused) {
        this.game.resume();
        this.$btnPause.textContent = t('pause');
      } else if (this.game.isRunning) {
        this.game.pause();
        this.$btnPause.textContent = t('resume');
      }
    });
    this.$btnRestart.addEventListener('click', () => {
      audio.playClick();
      this._startGame();
    });
    this.$btnPlayAgain.addEventListener('click', () => {
      audio.playClick();
      this._startGame();
    });

    // Settings modal
    this.$btnSettings.addEventListener('click', () => {
      audio.playClick();
      this._openModal(this.$settingsModal);
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        this._closeModal(modal);
      });
    });

    // Click overlay to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this._closeModal(overlay);
        }
      });
    });

    // Settings changes
    this.$speedSelect.addEventListener('change', () => {
      const speed = parseInt(this.$speedSelect.value);
      this.game.setSpeed(speed);
      localStorage.setItem('snakeSpeed', speed);
    });
    this.$gridSelect.addEventListener('change', () => {
      const size = parseInt(this.$gridSelect.value);
      this.game.setGridSize(size);
      localStorage.setItem('snakeGridSize', size);
    });
    this.$soundToggle.addEventListener('change', () => {
      const enabled = audio.toggle();
      this.$soundToggle.checked = enabled;
    });
    this.$dpadToggle.addEventListener('change', () => {
      this._dpadVisible = this.$dpadToggle.checked;
      this._updateDpadVisibility();
    });
    this.$langToggle.addEventListener('change', () => {
      const lang = this.$langToggle.checked ? 'en' : 'zh';
      switchLanguage(lang);
      this._updateAllText();
      this._renderThemeCards();
      this._updateModeButtons();
    });

    // Premium modal
    this.$btnUpgrade.addEventListener('click', () => {
      audio.playClick();
      payment.openCheckout();
    });
    document.getElementById('btnOpenPremium').addEventListener('click', (e) => {
      e.preventDefault();
      audio.playClick();
      this._openModal(this.$premiumModal);
    });

    // License modal
    // Sidebar premium card: "已有许可证密钥？" link
    document.getElementById('btnOpenLicense').addEventListener('click', () => {
      audio.playClick();
      this._closeModal(this.$premiumModal);
      this._openModal(this.$licenseModal);
      this.$licenseMsg.textContent = '';
      this.$licenseInput.value = '';
    });

    // Premium modal footer: "输入许可证密钥" button
    document.getElementById('btnOpenLicenseModal').addEventListener('click', () => {
      audio.playClick();
      this._closeModal(this.$premiumModal);
      this._openModal(this.$licenseModal);
      this.$licenseMsg.textContent = '';
      this.$licenseInput.value = '';
    });
    this.$btnActivate.addEventListener('click', () => this._activateLicense());
    this.$licenseInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._activateLicense();
    });

    // Mode buttons
    this.$modeClassic.addEventListener('click', () => this._setMode('classic'));
    this.$modeTimeAttack.addEventListener('click', () => this._setMode('timeAttack'));
    this.$modeMaze.addEventListener('click', () => this._setMode('maze'));

    // Keyboard controls
    document.addEventListener('keydown', (e) => this._handleKeyboard(e));

    // Touch controls on canvas
    this.$canvas.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
    this.$canvas.addEventListener('touchmove', (e) => this._handleTouchMove(e), { passive: false });
    this.$canvas.addEventListener('touchend', (e) => this._handleTouchEnd(e));

    // D-Pad buttons
    this.$dpadUp.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.setDirection(0, -1); });
    this.$dpadDown.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.setDirection(0, 1); });
    this.$dpadLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.setDirection(-1, 0); });
    this.$dpadRight.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.setDirection(1, 0); });

    // Game callbacks
    this.game.onScoreChange = (score) => { this.$score.textContent = score; };
    this.game.onHighScoreChange = (score) => { this.$highScore.textContent = score; };
    this.game.onComboChange = (combo) => {
      if (combo > 0) {
        this.$combo.textContent = combo + 'x';
        this.$comboContainer.classList.add('active');
      } else {
        this.$comboContainer.classList.remove('active');
      }
    };
    this.game.onTimeUpdate = (time) => {
      this.$timer.textContent = time;
      if (time <= 10) {
        this.$timerContainer.classList.add('urgent');
      } else {
        this.$timerContainer.classList.remove('urgent');
      }
    };
    this.game.onGameOver = (data) => {
      this._showGameOver(data);
      audio.playDeath();
      if (data.isNewHighScore) {
        setTimeout(() => audio.playHighScore(), 600);
      }
    };
    this.game.onEat = (data) => {
      audio.playEat();
      if (data.combo > 2) {
        audio.playCombo(Math.min(data.combo, 10));
      }
    };
    this.game.onStateChange = (state) => {
      if (state === 'playing') {
        this.$btnPlay.style.display = 'none';
        this.$btnPause.style.display = 'inline-block';
        this.$btnPause.textContent = t('pause');
      } else if (state === 'paused') {
        this.$btnPause.textContent = t('resume');
      } else if (state === 'gameover') {
        this.$btnPlay.style.display = 'inline-block';
        this.$btnPause.style.display = 'none';
      }
      this._updateModeButtons();
    };

    // PWA install
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      document.getElementById('btnInstall').style.display = 'inline-block';
    });
    document.getElementById('btnInstall').addEventListener('click', () => {
      if (this._deferredPrompt) {
        this._deferredPrompt.prompt();
        this._deferredPrompt.userChoice.then((result) => {
          if (result.outcome === 'accepted') {
            document.getElementById('btnInstall').textContent = t('pwaInstalled');
          }
          this._deferredPrompt = null;
        });
      }
    });

    // Close modals with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => this._closeModal(m));
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this._updateDpadVisibility();
    });
  }

  // ========== GAME CONTROL ==========

  _startGame() {
    this.game.mode = this.currentMode;
    this.game.setTheme(this.currentThemeId);

    // Check if maze mode is premium-locked
    if ((this.currentMode === 'timeAttack' || this.currentMode === 'maze') && !licenseManager.isPremium()) {
      this._openModal(this.$premiumModal);
      return;
    }

    this.$gameOverOverlay.style.display = 'none';
    this.$comboContainer.classList.remove('active');
    this.$combo.textContent = '';

    if (this.currentMode === 'timeAttack') {
      this.$timerContainer.style.display = 'flex';
      this.$timer.classList.remove('urgent');
    } else {
      this.$timerContainer.style.display = 'none';
    }

    this.game.start();
    this.$btnPlay.style.display = 'none';
    this.$btnPause.style.display = 'inline-block';
    this.$btnPause.textContent = t('pause');
    this._updateModeButtons();
  }

  _setMode(mode) {
    // Premium check
    if ((mode === 'timeAttack' || mode === 'maze') && !licenseManager.isPremium()) {
      this._openModal(this.$premiumModal);
      return;
    }
    this.currentMode = mode;
    this.game.setMode(mode);
    this._updateModeButtons();
    // Update game over title if applicable
  }

  // ========== GAME OVER ==========

  _showGameOver(data) {
    this.$finalScore.textContent = data.score;
    this.$gameOverTitle.textContent =
      this.currentMode === 'timeAttack' ? t('timeUp') : t('gameOver');

    if (data.isNewHighScore) {
      this.$newHighScore.style.display = 'block';
    } else {
      this.$newHighScore.style.display = 'none';
    }

    this.$gameOverOverlay.style.display = 'flex';
    this.$timerContainer.style.display = 'none';
    this.$comboContainer.classList.remove('active');
  }

  // ========== MODALS ==========

  _openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  _closeModal(modal) {
    modal.classList.remove('active');
    // Only restore scroll if no other modals are open
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.style.overflow = '';
    }
  }

  // ========== LICENSE ==========

  async _activateLicense() {
    const key = this.$licenseInput.value.trim();
    if (!key) {
      this.$licenseMsg.textContent = t('premiumInvalidKey');
      this.$licenseMsg.className = 'license-msg error';
      return;
    }

    this.$btnActivate.disabled = true;
    this.$btnActivate.textContent = '...';

    const result = await licenseManager.activateKey(key);

    if (result.success) {
      this.$licenseMsg.textContent = t('premiumActivated');
      this.$licenseMsg.className = 'license-msg success';
      this.$btnActivate.textContent = t('premiumActivated');
      setTimeout(() => {
        this._closeModal(this.$licenseModal);
        this._checkPremiumState();
        this._renderThemeCards();
        this.$btnActivate.disabled = false;
        this.$btnActivate.textContent = t('premiumActivate');
      }, 1500);
    } else {
      this.$licenseMsg.textContent = t('premiumInvalidKey');
      this.$licenseMsg.className = 'license-msg error';
      this.$btnActivate.disabled = false;
      this.$btnActivate.textContent = t('premiumActivate');
    }
  }

  _checkPremiumState() {
    if (licenseManager.isPremium()) {
      this.$premiumBadge.style.display = 'inline-block';
      this.$adBanner.style.display = 'none';
      this.$btnUpgrade.textContent = t('premiumThanks');
      this.$btnUpgrade.disabled = true;

      // Unlock premium theme cards
      document.querySelectorAll('.theme-card.premium').forEach(card => {
        card.classList.add('unlocked');
      });
    } else {
      this.$premiumBadge.style.display = 'none';
      this.$adBanner.style.display = 'block';
    }
  }

  // ========== THEMES ==========

  _renderThemeCards() {
    this.$themeCards.innerHTML = '';
    const isPremium = licenseManager.isPremium();

    THEMES.forEach((theme, index) => {
      const card = document.createElement('div');
      card.className = 'theme-card' + (theme.isPremium ? ' premium' : '');
      if (!theme.isPremium || isPremium) {
        card.classList.add('unlocked');
      }

      // Mini preview swatch
      const preview = document.createElement('div');
      preview.className = 'theme-preview';
      preview.style.backgroundColor = theme.colors.bg;

      const swatchSnake = document.createElement('div');
      swatchSnake.className = 'swatch-snake';
      swatchSnake.style.backgroundColor = theme.colors.snakeHead;
      preview.appendChild(swatchSnake);

      const swatchFood = document.createElement('div');
      swatchFood.className = 'swatch-food';
      swatchFood.style.backgroundColor = theme.colors.food;
      preview.appendChild(swatchFood);

      const info = document.createElement('div');
      info.className = 'theme-info';

      const name = document.createElement('span');
      name.className = 'theme-name';
      name.textContent = theme.name[currentLang] || theme.name.en;

      const badge = document.createElement('span');
      badge.className = 'theme-badge';
      if (theme.isPremium && !isPremium) {
        badge.textContent = '🔒';
      } else if (theme.isPremium) {
        badge.textContent = '⭐';
      } else {
        badge.textContent = '';
      }

      info.appendChild(name);
      info.appendChild(badge);
      card.appendChild(preview);
      card.appendChild(info);

      // Click handler
      card.addEventListener('click', () => {
        if (theme.isPremium && !licenseManager.isPremium()) {
          this._openModal(this.$premiumModal);
          return;
        }
        audio.playClick();
        this.currentThemeId = theme.id;
        this.game.setTheme(theme.id);
        // Highlight selection
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        localStorage.setItem('snakeTheme', theme.id);
      });

      // Restore saved selection
      if (theme.id === this.currentThemeId) {
        card.classList.add('selected');
      }

      this.$themeCards.appendChild(card);
    });
  }

  // ========== MODE BUTTONS ==========

  _updateModeButtons() {
    const isPremium = licenseManager.isPremium();
    const inGame = this.game.isRunning && !this.game.isGameOver;

    [this.$modeClassic, this.$modeTimeAttack, this.$modeMaze].forEach(btn => {
      btn.classList.remove('selected');
      if (inGame) btn.disabled = true;
      else btn.disabled = false;
    });

    // Lock indicators
    if (!isPremium) {
      this.$modeTimeAttack.querySelector('.mode-lock').style.display = 'inline';
      this.$modeMaze.querySelector('.mode-lock').style.display = 'inline';
    } else {
      this.$modeTimeAttack.querySelector('.mode-lock').style.display = 'none';
      this.$modeMaze.querySelector('.mode-lock').style.display = 'none';
    }

    // Highlight current mode
    switch (this.currentMode) {
      case 'classic': this.$modeClassic.classList.add('selected'); break;
      case 'timeAttack': this.$modeTimeAttack.classList.add('selected'); break;
      case 'maze': this.$modeMaze.classList.add('selected'); break;
    }

    // Show/hide mode description
    const descClassic = document.getElementById('modeDescClassic');
    const descTimeAttack = document.getElementById('modeDescTimeAttack');
    const descMaze = document.getElementById('modeDescMaze');
    if (descClassic) descClassic.style.display = this.currentMode === 'classic' ? '' : 'none';
    if (descTimeAttack) descTimeAttack.style.display = this.currentMode === 'timeAttack' ? '' : 'none';
    if (descMaze) descMaze.style.display = this.currentMode === 'maze' ? '' : 'none';
  }

  // ========== KEYBOARD ==========

  _handleKeyboard(e) {
    // Don't handle if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.game.setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.game.setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.game.setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.game.setDirection(1, 0);
        break;
      case ' ':
        e.preventDefault();
        if (this.game.isRunning && !this.game.isGameOver) {
          if (this.game.isPaused) {
            this.game.resume();
            this.$btnPause.textContent = t('pause');
          } else {
            this.game.pause();
            this.$btnPause.textContent = t('resume');
          }
        } else if (!this.game.isRunning || this.game.isGameOver) {
          this._startGame();
        }
        break;
    }
  }

  // ========== TOUCH CONTROLS ==========

  _handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
    this._touchStartTime = Date.now();
  }

  _handleTouchMove(e) {
    e.preventDefault(); // Prevent page scroll while playing
  }

  _handleTouchEnd(e) {
    if (!this.game.isRunning || this.game.isPaused) {
      // If game not running, tap to start
      if (!this.game.isRunning || this.game.isGameOver) {
        this._startGame();
      }
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this._touchStartX;
    const dy = touch.clientY - this._touchStartY;
    const dt = Date.now() - this._touchStartTime;

    // Minimum swipe distance & speed
    const minDistance = 20;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < minDistance) return;

    // Determine direction (horizontal or vertical)
    if (absDx > absDy) {
      this.game.setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      this.game.setDirection(0, dy > 0 ? 1 : -1);
    }
  }

  // ========== D-PAD ==========

  _initDpad() {
    this._updateDpadVisibility();
    // Prevent default touch behavior on D-pad
    [this.$dpadUp, this.$dpadDown, this.$dpadLeft, this.$dpadRight].forEach(btn => {
      btn.addEventListener('touchstart', (e) => e.preventDefault());
    });
  }

  _updateDpadVisibility() {
    const shouldShow = this._dpadVisible || window.innerWidth < 800;
    this.$dpad.style.display = shouldShow ? 'grid' : 'none';
  }

  // ========== PWA ==========

  _initPwa() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.getElementById('btnInstall').style.display = 'none';
    }
  }

  // ========== I18N ==========

  _updateAllText() {
    this._i18nElements.forEach(el => {
      const key = el.dataset.i18n;
      if (key) {
        // Handle placeholders
        if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
          el.placeholder = t(key);
        } else {
          el.textContent = t(key);
        }
      }
    });

    // Update button states
    if (this.game.isPaused) {
      this.$btnPause.textContent = t('resume');
    } else {
      this.$btnPause.textContent = t('pause');
    }

    // Update settings
    this.$soundToggle.checked = audio.isEnabled();
    this.$dpadToggle.checked = this._dpadVisible;

    // Update mode descriptions
    document.getElementById('modeDescClassic').textContent = t('modeDesc').classic;
    document.getElementById('modeDescTimeAttack').textContent = t('modeDesc').timeAttack;
    document.getElementById('modeDescMaze').textContent = t('modeDesc').maze;

    // Update license hint
    const licenseHint = document.getElementById('licenseHint');
    if (licenseHint) licenseHint.textContent = t('licenseHint');

    // Update premium features list (both sidebar and modal)
    const featureKeys = ['premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumFeature4', 'premiumFeature5'];
    // Sidebar
    const featureLis = this.$premiumFeatures.querySelectorAll('li');
    featureKeys.forEach((key, i) => {
      if (featureLis[i]) featureLis[i].textContent = t(key);
    });
    // Modal
    const modalFeatures = document.getElementById('premiumFeaturesModal');
    if (modalFeatures) {
      const modalLis = modalFeatures.querySelectorAll('li');
      featureKeys.forEach((key, i) => {
        if (modalLis[i]) modalLis[i].textContent = t(key);
      });
    }

    // Update mode buttons
    this._updateModeButtons();
  }

  // ========== PUBLIC API ==========

  /** Switch language and refresh all UI */
  changeLanguage(lang) {
    switchLanguage(lang);
    this._updateAllText();
    this._renderThemeCards();
    this.$langToggle.checked = (lang === 'en');
  }

  /** Refresh premium-related UI after activation */
  refreshPremiumState() {
    this._checkPremiumState();
    this._renderThemeCards();
    this._updateModeButtons();
  }

  /** Toggle D-pad visibility */
  toggleDpad(visible) {
    this._dpadVisible = visible;
    this._updateDpadVisibility();
  }
}
