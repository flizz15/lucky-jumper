import Phaser from 'phaser';
import Player from '../objects/Player';
import Platform from '../objects/Platform';
import { GameState } from '../managers/GameState';
import { GameHUD } from '../ui/GameHUD';
import { CashOutButton } from '../ui/CashOutButton';
import { COLORS, LAYOUT, GAME_DIMENSIONS, NEAR_WIN_CONFIG } from '../config/Constants';
import { Clouds } from '../objects/Clouds';

export class Game extends Phaser.Scene {
  private state: GameState;

  private player!: Player;
  private background!: Phaser.GameObjects.TileSprite;
  private cloudsManager!: Clouds;
  private currentPair: Platform[] = [];
  private currentFloor: Platform | null = null;
  private isMoving: boolean = false;
  private hud!: GameHUD;
  private cashOutBtn!: CashOutButton;
  private messageText!: Phaser.GameObjects.Text;

  // Przycisk debugowania
  private debugBtn!: Phaser.GameObjects.Text;

  // Winiety
  private vignetteOverlay!: Phaser.GameObjects.Image;
  private winVignetteOverlay!: Phaser.GameObjects.Image;

  private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Audio
  private bgMusic!: Phaser.Sound.BaseSound;
  private heartbeatSound!: Phaser.Sound.BaseSound;

  constructor() {
    super('Game');
    this.state = new GameState();
  }

  preload() {
    this.load.image('background', '/background-2.png');
    this.load.image('panel', '/panel.png');
    this.load.image('btn-cashout', '/wyplac.png');

    this.load.image('chmura1', '/chmura1.png');
    this.load.image('chmura2', '/chmura2.png');
    this.load.image('chmura3', '/chmura3.png');
    this.load.image('chmura4', '/chmura4.png');

    this.load.image('tecza', '/tecza.png');
    this.load.image('garniec', '/garniec.png');

    for (let i = 1; i <= 8; i++) this.load.image(`platforma${i}`, `/platforma${i}.png`);
    this.load.image('meta', '/meta.png');

    this.load.video('player_idle', '/macha.webm');
    this.load.video('player_jump', '/skacze.webm');
    this.load.video('player_lose', '/tupta.webm');

    // Audio
    this.load.audio('sfx_winwin', '/audio/winwin.mp3');
    this.load.audio('sfx_musicloop', '/audio/musicloop.mp3');
    this.load.audio('sfx_crack', '/audio/crack.mp3');
    this.load.audio('sfx_heartbeat', '/audio/heartbeat.mp3');
    this.load.audio('sfx_phonk', '/audio/phonk.ogg');
    this.load.audio('sfx_swoosh', '/audio/swoosh1.mp3');
  }

  create() {
    const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (!renderer.pipelines.has('RemoveBlack')) renderer.pipelines.addPostPipeline('RemoveBlack', RemoveBlackFX);
    if (!renderer.pipelines.has('GrainFX')) renderer.pipelines.addPostPipeline('GrainFX', GrainFX);
    if (!renderer.pipelines.has('ShineFX')) renderer.pipelines.addPostPipeline('ShineFX', ShineFX);

    // --- AUDIO INIT ---
    this.bgMusic = this.sound.add('sfx_musicloop', { loop: true, volume: 0.2 });
    if (!this.sound.locked) {
      this.bgMusic.play();
    } else {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        this.bgMusic.play();
      });
    }
    // Heartbeat startuje z volume 0, będziemy go podgłaśniać
    this.heartbeatSound = this.sound.add('sfx_heartbeat', { loop: true, volume: 0 });

    // 1. Generowanie tekstury monety
    const coinGraphics = this.make.graphics({ x: 0, y: 0 });
    coinGraphics.fillStyle(0xFFD700, 1);
    coinGraphics.fillCircle(16, 16, 15);
    coinGraphics.lineStyle(3, 0xB8860B, 1);
    coinGraphics.strokeCircle(16, 16, 15);
    coinGraphics.lineStyle(1, 0xFFE4B5, 0.8);
    coinGraphics.strokeCircle(16, 16, 11);
    coinGraphics.fillStyle(0xFFFFFF, 0.6);
    coinGraphics.fillCircle(10, 10, 4);
    coinGraphics.generateTexture('coin_particle', 32, 32);

    // 2. Winiety
    if (!this.textures.exists('vignette_tex')) {
      const canvas = this.textures.createCanvas('vignette_tex', GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
      if (canvas) {
        const ctx = canvas.context;
        const grd = ctx.createRadialGradient(GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2, GAME_DIMENSIONS.height * 0.2, GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2, GAME_DIMENSIONS.height * 0.8);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(0.6, 'rgba(150,0,0,0.5)');
        grd.addColorStop(1, 'rgba(0,0,0,0.95)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
        canvas.refresh();
      }
    }
    if (!this.textures.exists('win_vignette_tex')) {
      const canvas = this.textures.createCanvas('win_vignette_tex', GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
      if (canvas) {
        const ctx = canvas.context;
        const grd = ctx.createRadialGradient(GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2, GAME_DIMENSIONS.height * 0.1, GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2, GAME_DIMENSIONS.height * 0.9);
        grd.addColorStop(0, 'rgba(255, 255, 0, 0)');
        grd.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
        grd.addColorStop(1, 'rgba(0, 100, 0, 0.9)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
        canvas.refresh();
      }
    }

    // 3. Emiter monet
    this.coinEmitter = this.add.particles(0, 0, 'coin_particle', {
      x: { min: 0, max: GAME_DIMENSIONS.width },
      y: { min: -200, max: -50},
      lifespan: 3000,
      gravityY: 1000,
      speedY: { min: 400, max: 900 },
      speedX: { min: -50, max: 50 },
      rotate: { start: 0, end: 360 },
      scale: { min: 0.6, max: 1.0 },
      emitting: false
    });
    this.coinEmitter.setDepth(150);

    // 4. Inicjalizacja świata
    this.createBackground();
    this.cloudsManager = new Clouds(this);
    this.createUI();

    this.vignetteOverlay = this.add.image(LAYOUT.CENTER_X, GAME_DIMENSIONS.height / 2, 'vignette_tex').setDepth(190).setAlpha(0);
    this.winVignetteOverlay = this.add.image(LAYOUT.CENTER_X, GAME_DIMENSIONS.height / 2, 'win_vignette_tex').setDepth(190).setAlpha(0);

    this.player = new Player(this, LAYOUT.CENTER_X, LAYOUT.PLAYER_START_Y);
    this.startNewGame();
  }

  update() {
    if (this.cloudsManager) this.cloudsManager.update();
  }

  private createBackground() {
    this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
    this.background.setOrigin(0, 0).setDepth(-10).setTint(0x888888);
    this.background.postFX.addBlur(1, 2, 2, 1);
    const texture = this.textures.get('background').getSourceImage();
    const scale = this.scale.width / texture.width;
    this.background.setTileScale(scale, scale);
    this.background.tilePositionY = texture.height - (this.scale.height / scale);
  }

  private createUI() {
    this.hud = new GameHUD(this);
    this.hud.setDepth(300);

    this.cashOutBtn = new CashOutButton(this, LAYOUT.CENTER_X, LAYOUT.BTN_Y, () => this.handleCashOut());
    this.cashOutBtn.setDepth(300);

    this.messageText = this.add.text(LAYOUT.CENTER_X, GAME_DIMENSIONS.height * 0.5, '', {
      fontFamily: '"Luckiest Guy", "Comic Sans MS", fantasy',
      fontSize: `${LAYOUT.FONT_SIZE_MSG}px`,
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center',
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(400).setAlpha(0);

    // --- PRZYCISK DEBUGOWANIA ---
    this.debugBtn = this.add.text(20, GAME_DIMENSIONS.height / 2, 'DEBUG: OFF', {
      fontFamily: 'monospace',
      fontSize: '24px',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      color: '#888888'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(500)
      .on('pointerdown', () => {
        this.state.toggleDebug();
        this.updateDebugBtn();
      });
  }

  private updateDebugBtn() {
    if (this.state.isDebugMode) {
      this.debugBtn.setText('DEBUG: ON (WIN)');
      this.debugBtn.setColor('#00ff00');
      this.debugBtn.setStroke('#003300', 2);
    } else {
      this.debugBtn.setText('DEBUG: OFF');
      this.debugBtn.setColor('#888888');
      this.debugBtn.setStroke('#000000', 0);
    }
  }

  private startNewGame() {
    this.state.reset();
    this.isMoving = false;
    this.hud.updateStats(this.state.currentLevel, this.state.currentMultiplier, this.state.potentialWin);
    this.cashOutBtn.setEnabled(false);
    this.messageText.setAlpha(0);
    this.vignetteOverlay.setAlpha(0);
    this.winVignetteOverlay.setAlpha(0);

    // --- AUDIO RESET ---
    this.heartbeatSound.stop();

    // Przywracamy muzykę tła
    if (this.bgMusic.isPaused) {
      this.bgMusic.resume();
    }
    // Tweenujemy volume z powrotem do 0.2
    this.tweens.add({
      targets: this.bgMusic,
      volume: 0.2,
      duration: 1000
    });

    this.cameras.main.resetPostPipeline();
    this.cameras.main.resetFX();

    if (this.background) {
      // Przywracamy jasność tła
      this.background.setTint(0x888888);

      const texture = this.textures.get('background').getSourceImage();
      const scale = this.background.tileScaleX;
      this.background.tilePositionY = texture.height - (this.scale.height / scale);
    }

    if (this.cloudsManager) this.cloudsManager.resetAll();

    this.player.setPosition(LAYOUT.CENTER_X, LAYOUT.PLAYER_START_Y)
      .setRotation(0).setScale(1).setAlpha(1);
    this.player.resetState();

    this.spawnPlatforms();
  }

  private spawnPlatforms() {
    if (this.state.isMaxLevel()) return;
    const levelData = this.state.currentLevelData;
    const y = LAYOUT.PLATFORM_SPAWN_Y;
    const currentLevelIndex = this.state.currentLevel;

    const getUniqueTexturePair = (levelIndex: number) => {
      if (levelIndex === 9) return { left: 'meta', right: 'meta' };
      let availableIds = levelIndex >= 5 ? [6, 7, 8] : [1, 2, 3, 4, 5];
      const firstId = Phaser.Math.RND.pick(availableIds);
      const remainingIds = availableIds.filter(id => id !== firstId);
      const secondId = Phaser.Math.RND.pick(remainingIds.length > 0 ? remainingIds : availableIds);
      return { left: `platforma${firstId}`, right: `platforma${secondId}` };
    };

    const textures = getUniqueTexturePair(currentLevelIndex);

    const p1 = new Platform(this, LAYOUT.LEFT_PLATFORM_X, y, (p) => this.handleTurn(p));
    p1.configure(levelData.left.successRate, levelData.left.multiplier, textures.left);

    const p2 = new Platform(this, LAYOUT.RIGHT_PLATFORM_X, y, (p) => this.handleTurn(p));
    p2.configure(levelData.right.successRate, levelData.right.multiplier, textures.right);

    if (currentLevelIndex >= 6) {
      const progress = (currentLevelIndex - 5) / 5;
      const shineIntensity = 0.4 + (progress * 0.6);
      p1.setDangerMode(true, shineIntensity);
      p2.setDangerMode(true, shineIntensity);
    }

    this.currentPair = [p1, p2];
  }

  private handleTurn(clickedPlatform: Platform) {
    if (this.isMoving || !this.state.isActive) return;
    this.isMoving = true;
    const currentLevel = this.state.currentLevel;
    this.currentPair.forEach(p => p.image.disableInteractive());

    // Audio
    this.sound.play('sfx_swoosh', { volume: 0.6 });

    this.player.jumpTo(clickedPlatform.x, clickedPlatform.y, () => {
      const success = this.state.processJump(clickedPlatform.successRate, clickedPlatform.multiplier);
      if (success) {
        this.currentPair.find(p => p !== clickedPlatform)?.vanish();
        this.handleSuccess(clickedPlatform);
      } else {
        if (currentLevel >= NEAR_WIN_CONFIG.ACTIVATION_LEVEL_INDEX) {
          this.handleNearWinSequence(clickedPlatform);
        } else {
          this.currentPair.find(p => p !== clickedPlatform)?.vanish();
          this.handleGameOver(clickedPlatform);
        }
      }
    });
  }

  private handleNearWinSequence(trapPlatform: Platform) {
    this.cashOutBtn.setVisible(false);

    // Audio
    this.sound.play('sfx_crack');
    if (this.heartbeatSound.isPlaying) this.heartbeatSound.stop();

    const duration = NEAR_WIN_CONFIG.TOTAL_DURATION;

    this.cameras.main.setPostPipeline('GrainFX');
    this.tweens.add({ targets: this.vignetteOverlay, alpha: 1, duration: 200, ease: 'Power2' });
    this.cameras.main.shake(duration, 0.04, true);

    const lostAmount = (this.state.currentBet * this.state.currentMultiplier * trapPlatform.multiplier).toFixed(0);

    const nearWinText = this.add.text(LAYOUT.CENTER_X, GAME_DIMENSIONS.height * 0.4,
      `STRACONO\n${lostAmount} PLN`, {
        fontFamily: '"Luckiest Guy"',
        fontSize: '120px',
        color: '#ff0000',
        stroke: '#ffffff',
        strokeThickness: 10,
        align: 'center'
      }).setOrigin(0.5).setDepth(300).setAlpha(1);

    this.tweens.add({
      targets: nearWinText,
      scale: { from: 0.8, to: 1.2 },
      angle: { from: -5, to: 5 },
      duration: 80,
      yoyo: true,
      repeat: -1
    });

    const colors = ['#ff0000', '#ffff00', '#ffffff'];
    let colorIdx = 0;
    const colorTimer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        colorIdx = (colorIdx + 1) % colors.length;
        nearWinText.setColor(colors[colorIdx]);
      }
    });

    trapPlatform.playBreakAnimation(duration, () => {
      colorTimer.remove();
      this.tweens.killTweensOf(nearWinText);
      nearWinText.destroy();

      this.tweens.add({ targets: this.vignetteOverlay, alpha: 0.3, duration: 500 });
      this.cameras.main.resetPostPipeline();

      this.player.fallDown(() => {
        this.showMessage("KONIEC GRY", COLORS.TEXT_RED, "Spróbuj ponownie");
      });
    });
  }

  private handleSuccess(platform: Platform) {
    this.hud.updateStats(this.state.currentLevel, this.state.currentMultiplier, this.state.potentialWin);
    this.showFloatingText(platform.x, platform.y - 50, `x${this.state.currentMultiplier.toFixed(2)}`);

    this.spawnCoins(20 + this.state.currentLevel * 20);

    const currentLevel = this.state.currentLevel;

    // --- AUDIO: LĄDOWANIE ---
    // Pitch rośnie z każdym poziomem
    const pitch = 1.0 + (currentLevel * 0.05);
    this.sound.play('sfx_phonk', { rate: pitch, volume: 1.5 }); // Podgłośniony phonk

    // --- HIGH STAKES ATMOSPHERE (od 6 poziomu) ---
    if (currentLevel >= 6) {
      // 1. Wyciszamy muzykę tła
      if (this.bgMusic.isPlaying) {
        this.tweens.add({
          targets: this.bgMusic,
          volume: 0.08,
          duration: 500,
        });
      }

      // 2. Podgłaśniamy Heartbeat (1.2 to 120% głośności)
      if (!this.heartbeatSound.isPlaying) this.heartbeatSound.play();
      (this.heartbeatSound as any).setVolume(1.2);

      // 3. Przyciemniamy tło
      // 0x88 (136) -> start. 0x44 (68) -> koniec.
      // Skalujemy od lvl 6 do 10
      const progress = (currentLevel - 5) / 5; // 0.2 -> 1.0
      const darkVal = 136 - (68 * progress); // Schodzimy z jasnością
      const colorComp = Math.floor(darkVal);
      // const color = Phaser.Display.Color.GetColor(colorComp, colorComp, colorComp);

      this.tweens.addCounter({
        from: 136, // Z poprzedniego stanu (uproszczone) lub aktualnego
        to: colorComp,
        duration: 500,
        onUpdate: (tween) => {
          const c = Math.floor(tween.getValue() || 128);
          const tint = Phaser.Display.Color.GetColor(c, c, c);
          this.background.setTint(tint);
        }
      });
    }

    if (this.cloudsManager) {
      this.cloudsManager.setLevel(currentLevel);
    }

    if (currentLevel >= 6) {
      const tensionProgress = (currentLevel - 5) / 5;
      const ambientShake = 0.001 + (0.003 * tensionProgress);
      this.cameras.main.shake(200000, ambientShake, true);
    }

    platform.image.disableInteractive();
    if (this.state.isMaxLevel()) {
      this.scrollWorld(platform, () => this.handleWin(true));
    } else {
      this.scrollWorld(platform, () => this.spawnPlatforms());
    }
  }

  private scrollWorld(landedPlatform: Platform, onComplete: () => void) {
    this.cashOutBtn.setEnabled(true);
    const moveY = LAYOUT.PLAYER_START_Y - landedPlatform.y;
    const moveX = LAYOUT.CENTER_X - landedPlatform.x;
    const bgScrollAmount = moveY * 0.4;
    this.tweens.add({ targets: this.background, tilePositionY: `-=${bgScrollAmount}`, duration: 500, ease: 'Cubic.out' });
    if (this.cloudsManager) this.cloudsManager.tweenVertical(moveY, 500);
    const targets: any[] = [this.player, landedPlatform];
    if (this.currentFloor) targets.push(this.currentFloor);
    this.tweens.add({
      targets: targets, x: `+=${moveX}`, y: `+=${moveY}`, duration: 500, ease: 'Cubic.out',
      onComplete: () => {
        this.currentFloor?.destroy();
        this.currentFloor = landedPlatform;
        this.isMoving = false;
        onComplete();
      }
    });
  }

  private handleCashOut() {
    if (this.isMoving || !this.state.isActive) return;
    this.state.cashOut();
    this.handleWin(false);
  }

  private handleWin(isMax: boolean) {
    this.cashOutBtn.setVisible(false);

    this.cameras.main.resetFX();

    // Audio
    this.sound.play('sfx_winwin');
    if (this.heartbeatSound.isPlaying) this.heartbeatSound.stop();

    const currentLvl = Phaser.Math.Clamp(this.state.currentLevel, 1, 10);
    const progress = (currentLvl - 1) / 9;

    const intensity = 0.4 + (progress * 0.6);
    const visualPower = 0.2 + (0.8 * progress);

    const coinBurst = Math.floor(200 * intensity);
    const coinFlowRate = Math.floor(15 * intensity);
    const duration = 2500 + (2000 * intensity);
    const textScaleBase = 0.7 + (0.3 * intensity);
    const shakeForce = 0.0005 + (0.0145 * Math.pow(progress, 2));

    // Bezpieczne ustawienie Pipeline
    if (!this.cameras.main.getPostPipeline('ShineFX')) {
      this.cameras.main.setPostPipeline('ShineFX');
    }

    const pipelineOrArray = this.cameras.main.getPostPipeline('ShineFX');
    let shinePipeline: any = null;

    if (Array.isArray(pipelineOrArray)) {
      shinePipeline = pipelineOrArray[0];
    } else {
      shinePipeline = pipelineOrArray;
    }

    if (shinePipeline && typeof shinePipeline.set1f === 'function') {
      shinePipeline.set1f('uIntensity', visualPower);
    }

    this.cameras.main.flash(duration / 3, 255, 255, 255);
    this.cameras.main.shake(duration, shakeForce);

    this.tweens.add({ targets: this.winVignetteOverlay, alpha: visualPower, duration: 500, ease: 'Sine.easeInOut' });

    this.coinEmitter.explode(coinBurst);
    const flowCoins = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.coinEmitter.explode(coinFlowRate)
    });

    const titleText = isMax ? "MAX WIN!" : "WYGRANA!";
    const finalAmount = this.state.potentialWin;

    const winTitle = this.add.text(LAYOUT.CENTER_X, GAME_DIMENSIONS.height * 0.35, titleText, {
      fontFamily: '"Luckiest Guy"',
      fontSize: '100px',
      color: '#FFD700',
      stroke: '#FFFFFF',
      strokeThickness: 8,
      shadow: { blur: 20, color: '#FFD700', fill: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5).setDepth(300).setScale(0);

    const amountText = this.add.text(LAYOUT.CENTER_X, GAME_DIMENSIONS.height * 0.55, "0 PLN", {
      fontFamily: '"Luckiest Guy"',
      fontSize: '140px',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(300).setScale(0);

    this.tweens.add({
      targets: [winTitle, amountText],
      scale: textScaleBase,
      duration: 800,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: [winTitle, amountText],
          scale: textScaleBase * 1.1,
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
    });

    const countDuration = Math.min(duration - 1000, 2000);

    this.tweens.addCounter({
      from: 0,
      to: finalAmount,
      duration: countDuration,
      ease: 'Cubic.out',
      onUpdate: (tween) => {
        const val = Math.floor(tween.getValue() || 0);
        amountText.setText(`${val} PLN`);
        if (val % 2 === 0) amountText.setColor('#00FF00');
        else amountText.setColor('#AAFF00');
      }
    });

    this.time.delayedCall(duration, () => {
      flowCoins.remove();

      this.tweens.add({
        targets: [winTitle, amountText, this.winVignetteOverlay],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          winTitle.destroy();
          amountText.destroy();
          this.cameras.main.resetPostPipeline();
          this.cleanupAndRestart();
        }
      });
    });
  }

  private handleGameOver(trapPlatform: Platform) {
    this.cashOutBtn.setVisible(false);

    // Audio
    this.sound.play('sfx_crack');
    if (this.heartbeatSound.isPlaying) this.heartbeatSound.stop();

    trapPlatform.revealTrap();
    this.cameras.main.shake(400, 0.03);
    this.player.fallDown(() => {
      this.showMessage("PRZEGRANA", COLORS.TEXT_RED, "Straciłeś wszystko");
    });
  }

  private showMessage(title: string, color: string, sub: string) {
    this.messageText.setText(`${title}\n${sub}`).setColor(color).setScale(0).setAlpha(1);
    this.tweens.add({
      targets: this.messageText,
      scale: 1, duration: 500, ease: 'Back.out',
      onComplete: () => this.time.delayedCall(3000, () => this.cleanupAndRestart())
    });
  }

  private cleanupAndRestart() {
    this.tweens.killAll();
    this.currentPair.forEach(p => { if(p && p.active) p.destroy(); });
    this.currentPair = [];
    if (this.currentFloor && this.currentFloor.active) this.currentFloor.destroy();
    this.currentFloor = null;
    this.player.setPosition(LAYOUT.CENTER_X, LAYOUT.PLAYER_START_Y).setRotation(0).setScale(1).setAlpha(1);
    this.player.resetState();
    this.cashOutBtn.setVisible(true);
    this.startNewGame();
  }

  private showFloatingText(x: number, y: number, msg: string) {
    const t = this.add.text(x, y, msg, {
      fontFamily: '"Luckiest Guy", "Comic Sans MS"', fontSize: '28px', color: COLORS.TEXT_GREEN, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y-50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private spawnCoins(amount: number = 50) {
    this.coinEmitter.explode(amount);
  }
}

// --- SHADERY ---

class RemoveBlackFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;
        void main(void) {
            vec4 color = texture2D(uMainSampler, outTexCoord);
            float maxChannel = max(color.r, max(color.g, color.b));
            float alpha = smoothstep(0.0, 0.05, maxChannel);
            gl_FragColor = vec4(color.rgb, color.a * alpha);
        }
      `
    });
  }
}

class GrainFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float uTime; 
        varying vec2 outTexCoord;
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        void main(void) {
            vec4 color = texture2D(uMainSampler, outTexCoord);
            float noise = random(outTexCoord * uTime);
            vec3 noisyColor = color.rgb * (1.0 - 0.3 * noise);
            gl_FragColor = vec4(noisyColor, color.a);
        }
      `
    });
  }
  onPreRender() { this.set1f('uTime', this.game.loop.time); }
}

class ShineFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float uTime;
        uniform float uIntensity; 
        varying vec2 outTexCoord;

        void main(void) {
            vec4 color = texture2D(uMainSampler, outTexCoord);
            float pos = mod(uTime * 0.002, 2.0); 
            float dist = abs((outTexCoord.x + outTexCoord.y) - pos);
            float shine = smoothstep(0.2, 0.0, dist) * 0.6 * uIntensity; 
            vec3 finalColor = color.rgb + shine;
            gl_FragColor = vec4(finalColor, color.a);
        }
      `
    });
  }
  onPreRender() { this.set1f('uTime', this.game.loop.time); }
}