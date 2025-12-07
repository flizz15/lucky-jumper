import { LEVELS } from '../config/Levels';
import { GAME_SETTINGS } from '../config/Constants';

export class GameState {
  public currentLevel: number = 0;
  public currentMultiplier: number = 1.0;
  public currentBet: number = GAME_SETTINGS.STARTING_BET;
  public isActive: boolean = true;

  // NOWE: Flaga debugowania
  public isDebugMode: boolean = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.currentLevel = 0;
    this.currentMultiplier = 1.0;
    this.currentBet = GAME_SETTINGS.STARTING_BET;
    this.isActive = true;
    // Nie resetujemy isDebugMode, żeby nie trzeba było go klikać co grę
  }

  public toggleDebug() {
    this.isDebugMode = !this.isDebugMode;
  }

  public get currentLevelData() {
    return LEVELS[this.currentLevel];
  }

  public get potentialWin(): number {
    return Math.floor(this.currentBet * this.currentMultiplier);
  }

  public isMaxLevel(): boolean {
    return this.currentLevel >= GAME_SETTINGS.MAX_LEVELS;
  }

  public processJump(successRate: number, multiplierToAdd: number): boolean {
    // --- DEBUG MODE: ZAWSZE WYGRYWA ---
    if (this.isDebugMode) {
      console.log("[DEBUG] Auto-Win triggered");
      this.currentMultiplier *= multiplierToAdd;
      this.currentLevel++;
      return true;
    }
    // ----------------------------------

    const roll = Math.random();
    const isSuccess = roll < successRate;

    if (isSuccess) {
      this.currentMultiplier *= multiplierToAdd;
      this.currentLevel++;
    } else {
      this.isActive = false;
    }

    return isSuccess;
  }

  public cashOut() {
    this.isActive = false;
  }
}