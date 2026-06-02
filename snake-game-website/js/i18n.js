/**
 * Internationalization (i18n) — English & Chinese
 * 中英文翻译数据
 */

const I18N = {
  en: {
    // Header
    gameTitle: '🐍 Snake Arena',
    tagline: 'Classic Snake. Modern Twist.',
    langLabel: '中文',

    // Score
    score: 'Score',
    highScore: 'Best',
    combo: 'Combo',

    // Buttons
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    settings: 'Settings',
    close: 'Close',

    // Game modes
    modeClassic: 'Classic',
    modeTimeAttack: 'Time Attack',
    modeMaze: 'Maze',
    modeDesc: {
      classic: 'Eat food, grow longer, avoid walls & yourself.',
      timeAttack: 'Score as many points as possible in 60 seconds!',
      maze: 'Navigate through random obstacles. Hard mode!',
    },

    // Settings
    settingsTitle: 'Game Settings',
    speed: 'Speed',
    speedSlow: 'Slow',
    speedNormal: 'Normal',
    speedFast: 'Fast',
    gridSize: 'Grid Size',
    sound: 'Sound',
    soundOn: 'On',
    soundOff: 'Off',
    dpad: 'On-Screen D-Pad',
    dpadOn: 'Show',
    dpadOff: 'Hide',
    language: 'Language',

    // Themes
    themes: 'Themes',
    themeFree: 'Free',
    themePremium: 'Premium',
    themeLocked: '🔒 Unlock with Premium',

    // Game Over
    gameOver: 'Game Over!',
    finalScore: 'Final Score',
    newHighScore: '🏆 New High Score!',
    playAgain: 'Play Again',
    timeUp: 'Time\'s Up!',

    // Premium
    premiumTitle: 'Upgrade to Premium',
    premiumDesc: 'Unlock all features with a one-time purchase:',
    premiumFeature1: '🚫 Remove all ads forever',
    premiumFeature2: '🎨 5 exclusive premium themes',
    premiumFeature3: '🕹️ Time Attack & Maze modes',
    premiumFeature4: '✨ Gold snake trail effect',
    premiumFeature5: '💾 Lifetime license, no subscription',
    premiumPrice: '$2.99',
    premiumBuy: 'Upgrade Now',
    premiumHaveKey: 'Already have a license key?',
    premiumEnterKey: 'Enter License Key',
    premiumActivate: 'Activate',
    premiumActivated: '✅ Premium Activated!',
    premiumInvalidKey: '❌ Invalid license key. Please try again.',
    premiumThanks: 'Thank you for your support! 🎉',

    // License
    licenseTitle: 'Enter License Key',
    licensePlaceholder: 'XXXX-XXXX-XXXX-XXXX',
    licenseHint: 'Your license key was sent to your email after purchase.',

    // Ads
    adPlaceholder: '📢 Advertisement — Upgrade to Premium to remove ads',

    // Instructions
    instructions: 'Use Arrow Keys or WASD to move',
    mobileInstructions: 'Swipe or use D-Pad to move',

    // PWA
    pwaInstall: 'Install App',
    pwaInstalled: 'App Installed!',

    // Footer
    footerText: '© 2026 Snake Arena. All rights reserved.',
    footerPowered: 'Powered by Lemon Squeezy',
  },

  zh: {
    // Header
    gameTitle: '🐍 贪吃蛇竞技场',
    tagline: '经典贪吃蛇，全新体验。',
    langLabel: 'EN',

    // Score
    score: '分数',
    highScore: '最高分',
    combo: '连击',

    // Buttons
    play: '开始游戏',
    pause: '暂停',
    resume: '继续',
    restart: '重新开始',
    settings: '设置',
    close: '关闭',

    // Game modes
    modeClassic: '经典模式',
    modeTimeAttack: '限时挑战',
    modeMaze: '迷宫模式',
    modeDesc: {
      classic: '吃食物变长，别撞墙也别撞到自己。',
      timeAttack: '60秒内尽可能多地得分！',
      maze: '穿越随机障碍物，困难模式！',
    },

    // Settings
    settingsTitle: '游戏设置',
    speed: '速度',
    speedSlow: '慢',
    speedNormal: '中',
    speedFast: '快',
    gridSize: '网格大小',
    sound: '音效',
    soundOn: '开',
    soundOff: '关',
    dpad: '屏幕方向键',
    dpadOn: '显示',
    dpadOff: '隐藏',
    language: '语言',

    // Themes
    themes: '皮肤',
    themeFree: '免费',
    themePremium: '高级',
    themeLocked: '🔒 升级高级版解锁',

    // Game Over
    gameOver: '游戏结束！',
    finalScore: '最终分数',
    newHighScore: '🏆 新最高纪录！',
    playAgain: '再来一局',
    timeUp: '时间到！',

    // Premium
    premiumTitle: '升级高级版',
    premiumDesc: '一次性购买，解锁全部功能：',
    premiumFeature1: '🚫 永久去除广告',
    premiumFeature2: '🎨 5款专属高级皮肤',
    premiumFeature3: '🕹️ 限时挑战 & 迷宫模式',
    premiumFeature4: '✨ 金色拖尾特效',
    premiumFeature5: '💾 永久授权，无需订阅',
    premiumPrice: '¥19.9',
    premiumBuy: '立即升级',
    premiumHaveKey: '已有许可证密钥？',
    premiumEnterKey: '输入许可证密钥',
    premiumActivate: '激活',
    premiumActivated: '✅ 高级版已激活！',
    premiumInvalidKey: '❌ 密钥无效，请重试。',
    premiumThanks: '感谢支持！🎉',

    // License
    licenseTitle: '输入许可证密钥',
    licensePlaceholder: 'XXXX-XXXX-XXXX-XXXX',
    licenseHint: '购买后许可证密钥已发送到您的邮箱。',

    // Ads
    adPlaceholder: '📢 广告位 — 升级高级版即可去广告',

    // Instructions
    instructions: '使用方向键 ↑↓←→ 或 WASD 控制移动',
    mobileInstructions: '滑动屏幕或使用方向键控制',

    // PWA
    pwaInstall: '安装到桌面',
    pwaInstalled: '已安装！',

    // Footer
    footerText: '© 2026 Snake Arena. 保留所有权利。',
    footerPowered: '由 Lemon Squeezy 提供支付支持',
  }
};

// Current language
let currentLang = localStorage.getItem('snakeLang') || 'zh';

// Get translation
function t(key) {
  const lang = I18N[currentLang] || I18N['en'];
  return lang[key] || I18N['en'][key] || key;
}

// Switch language
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('snakeLang', lang);
}
