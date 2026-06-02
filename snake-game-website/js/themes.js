/**
 * Snake Game Theme Definitions
 * 贪吃蛇游戏皮肤定义
 *
 * 3 free themes + 5 premium themes
 * Each theme defines colors for: snake head, snake body, food, grid, background, accent
 */

const THEMES = [
  // ============ FREE THEMES ============
  {
    id: 'classic-green',
    name: { en: 'Classic Green', zh: '经典绿' },
    isPremium: false,
    colors: {
      // Canvas colors
      bg: '#1a1a2e',
      grid: '#2a2a4a',
      snakeHead: '#4ade80',
      snakeBody: 'rgba(74, 222, 128, {alpha})',
      snakeStroke: '#22c55e',
      food: '#ff6b6b',
      foodGlow: '#ff6b6b',
      // UI accent
      accent: '#4ade80',
      accentGradient: 'linear-gradient(135deg, #22c55e, #4ade80)',
      // Particles
      particle: '#4ade80',
      // Obstacles (maze mode)
      obstacle: '#555577',
    }
  },
  {
    id: 'ocean-blue',
    name: { en: 'Ocean Blue', zh: '海洋蓝' },
    isPremium: false,
    colors: {
      bg: '#0c1929',
      grid: '#1a3050',
      snakeHead: '#38bdf8',
      snakeBody: 'rgba(56, 189, 248, {alpha})',
      snakeStroke: '#0ea5e9',
      food: '#fbbf24',
      foodGlow: '#fbbf24',
      accent: '#38bdf8',
      accentGradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
      particle: '#38bdf8',
      obstacle: '#1e4058',
    }
  },
  {
    id: 'sunset-orange',
    name: { en: 'Sunset Orange', zh: '日落橙' },
    isPremium: false,
    colors: {
      bg: '#1a1410',
      grid: '#3a2820',
      snakeHead: '#fb923c',
      snakeBody: 'rgba(251, 146, 60, {alpha})',
      snakeStroke: '#f97316',
      food: '#facc15',
      foodGlow: '#facc15',
      accent: '#fb923c',
      accentGradient: 'linear-gradient(135deg, #f97316, #fb923c)',
      particle: '#fb923c',
      obstacle: '#4a3830',
    }
  },

  // ============ PREMIUM THEMES ============
  {
    id: 'neon-night',
    name: { en: 'Neon Night', zh: '霓虹夜' },
    isPremium: true,
    colors: {
      bg: '#0a0a0a',
      grid: '#1a0030',
      snakeHead: '#ff00ff',
      snakeBody: 'rgba(255, 0, 255, {alpha})',
      snakeStroke: '#ff66ff',
      food: '#00ffff',
      foodGlow: '#00ffff',
      accent: '#ff00ff',
      accentGradient: 'linear-gradient(135deg, #ff00ff, #00ffff)',
      particle: '#ff00ff',
      obstacle: '#1a1a3a',
    }
  },
  {
    id: 'cyberpunk',
    name: { en: 'Cyberpunk', zh: '赛博朋克' },
    isPremium: true,
    colors: {
      bg: '#0d0221',
      grid: '#1a0a3a',
      snakeHead: '#ff003c',
      snakeBody: 'rgba(255, 0, 60, {alpha})',
      snakeStroke: '#ff3355',
      food: '#00ff88',
      foodGlow: '#00ff88',
      accent: '#ff003c',
      accentGradient: 'linear-gradient(135deg, #ff003c, #00ff88)',
      particle: '#ff003c',
      obstacle: '#2a1a4a',
    }
  },
  {
    id: 'galaxy',
    name: { en: 'Galaxy', zh: '银河' },
    isPremium: true,
    colors: {
      bg: '#010118',
      grid: '#1a1a50',
      snakeHead: '#c084fc',
      snakeBody: 'rgba(192, 132, 252, {alpha})',
      snakeStroke: '#a855f7',
      food: '#fde047',
      foodGlow: '#fde047',
      accent: '#c084fc',
      accentGradient: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
      particle: '#c084fc',
      obstacle: '#252560',
    }
  },
  {
    id: 'gold-snake',
    name: { en: 'Gold Snake', zh: '金蛇' },
    isPremium: true,
    colors: {
      bg: '#1a1200',
      grid: '#3a2a10',
      snakeHead: '#fbbf24',
      snakeBody: 'rgba(251, 191, 36, {alpha})',
      snakeStroke: '#f59e0b',
      food: '#ef4444',
      foodGlow: '#ef4444',
      accent: '#fbbf24',
      accentGradient: 'linear-gradient(135deg, #b45309, #fbbf24)',
      particle: '#fbbf24',
      obstacle: '#4a3a20',
    }
  },
  {
    id: 'retro-arcade',
    name: { en: 'Retro Arcade', zh: '复古街机' },
    isPremium: true,
    colors: {
      bg: '#000000',
      grid: '#003300',
      snakeHead: '#00ff00',
      snakeBody: 'rgba(0, 255, 0, {alpha})',
      snakeStroke: '#00cc00',
      food: '#ff0000',
      foodGlow: '#ff0000',
      accent: '#00ff00',
      accentGradient: 'linear-gradient(135deg, #00cc00, #00ff00)',
      particle: '#00ff00',
      obstacle: '#004400',
    }
  },
];

// Default theme index
const DEFAULT_THEME = 0;

// Get theme by ID
function getThemeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[DEFAULT_THEME];
}

// Get theme colors with alpha applied to snake body
function getThemeColors(themeId) {
  const theme = getThemeById(themeId);
  return theme.colors;
}
