export interface LevelConfig {
  left: { successRate: number; multiplier: number };
  right: { successRate: number; multiplier: number };
}

export const LEVELS: LevelConfig[] = [
  { left: { successRate: 0.60, multiplier: 1.50 }, right: { successRate: 0.80, multiplier: 1.15 } },
  { left: { successRate: 0.55, multiplier: 1.70 }, right: { successRate: 0.75, multiplier: 1.25 } },
  { left: { successRate: 0.50, multiplier: 1.95 }, right: { successRate: 0.70, multiplier: 1.40 } },
  { left: { successRate: 0.45, multiplier: 2.30 }, right: { successRate: 0.65, multiplier: 1.60 } },
  { left: { successRate: 0.40, multiplier: 2.80 }, right: { successRate: 0.60, multiplier: 1.85 } },
  { left: { successRate: 0.35, multiplier: 3.50 }, right: { successRate: 0.55, multiplier: 2.20 } },
  { left: { successRate: 0.30, multiplier: 4.50 }, right: { successRate: 0.50, multiplier: 2.70 } },
  { left: { successRate: 0.25, multiplier: 6.00 }, right: { successRate: 0.45, multiplier: 3.40 } },
  { left: { successRate: 0.20, multiplier: 8.50 }, right: { successRate: 0.40, multiplier: 4.50 } },
  { left: { successRate: 0.15, multiplier: 12.00 }, right: { successRate: 0.35, multiplier: 6.00 } },
];