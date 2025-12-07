export const GAME_DIMENSIONS = {
  width: 1200,
  height: 900
};

const { width, height } = GAME_DIMENSIONS;

export const LAYOUT = {
  CENTER_X: width * 0.5,
  PLAYER_START_Y: height * 0.83,
  PLAYER_SIZE: Math.floor(width * 0.07),
  JUMP_HEIGHT_OFFSET: height * 0.4,

  PLATFORM_SPAWN_Y: height * 0.5,
  PLATFORM_WIDTH: width * 0.19,
  PLATFORM_HEIGHT: height * 0.04,

  LEFT_PLATFORM_X: width * 0.3,
  RIGHT_PLATFORM_X: width * 0.7,

  HUD_HEIGHT: height * 0.13,
  BTN_WIDTH: width * 0.25,
  BTN_HEIGHT: height * 0.1,
  BTN_Y: height * 0.92,

  FONT_SIZE_HUD: Math.floor(width * 0.03),
  FONT_SIZE_BTN: Math.floor(height * 0.045),
  FONT_SIZE_MSG: Math.floor(width * 0.1),
};

export const COLORS = {
  UI_BACKGROUND: 0x000000,
  TEXT_WHITE: '#ffffff',
  TEXT_GOLD: '#ffff00',
  TEXT_GREEN: '#00ff00',
  TEXT_RED: '#ff0000',
  PLATFORM_SAFE: 0x44ff44,
  PLATFORM_RISK: 0xff4444,
  PLATFORM_TRAP: 0x222222,
  BTN_CASHOUT: 0xffd700,
  NEAR_WIN_TEXT: '#ff0000', // Czerwony jak krew
};

export const GAME_SETTINGS = {
  STARTING_BET: 100,
  MAX_LEVELS: 10,
};

export const NEAR_WIN_CONFIG = {
  ACTIVATION_LEVEL_INDEX: 5,
  TOTAL_DURATION: 1200,      // Skrócone o 20% (z 1500)
  SHAKE_INTENSITY_START: 15, // Zwiększone (było 5)
  SHAKE_INTENSITY_END: 35,   // Zwiększone znacznie (było 15)
};