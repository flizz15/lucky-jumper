import Phaser from 'phaser';
import { COLORS, LAYOUT, NEAR_WIN_CONFIG } from '../config/Constants';

export default class Platform extends Phaser.GameObjects.Container {
  public image: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;
  private cracksGraphics: Phaser.GameObjects.Graphics | null = null;

  public successRate: number = 0;
  public multiplier: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, onClick: (p: Platform) => void) {
    super(scene, x, y);
    scene.add.existing(this);

    this.image = scene.add.image(0, 0, 'platforma1');

    const targetWidth = LAYOUT.PLATFORM_WIDTH;
    const scale = targetWidth / this.image.width;
    this.image.setScale(scale);

    const fontSize = Math.floor(LAYOUT.PLATFORM_WIDTH * 0.16);

    this.text = scene.add.text(0, 0, '', {
      fontFamily: '"Luckiest Guy", "Comic Sans MS", fantasy',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5);

    this.add([this.image, this.text]);

    this.image.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => onClick(this));
  }

  public configure(successRate: number, multiplier: number, textureKey: string) {
    this.successRate = successRate;
    this.multiplier = multiplier;
    this.text.setText(`x${multiplier.toFixed(2)}`);

    this.image.clearTint();
    this.image.setTexture(textureKey);
    this.image.setAlpha(1);

    // Reset: usuwamy shader przy ponownej konfiguracji
    this.image.removePostPipeline('ShineFX');

    if (this.cracksGraphics) {
      this.cracksGraphics.clear();
    }

    const targetWidth = LAYOUT.PLATFORM_WIDTH;

    if (textureKey === 'meta') {
      const metaWidth = targetWidth * 1.5;
      const scale = metaWidth / this.image.width;
      this.image.setScale(scale);
      this.text.setY(this.image.displayHeight * 0.25);
    } else {
      const scale = targetWidth / this.image.width;
      this.image.setScale(scale);
      this.text.setY(this.image.displayHeight * 0.1);
    }
  }

  public revealTrap() {
    this.image.setTint(0x555555);
    this.text.setText("X").setColor(COLORS.TEXT_RED);
    this.image.removePostPipeline('ShineFX');
  }

  public vanish() {
    this.image.disableInteractive();
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 200, onComplete: () => this.destroy() });
  }

  public playBreakAnimation(duration: number, onComplete: () => void) {
    if (!this.cracksGraphics) {
      this.cracksGraphics = this.scene.add.graphics();
      this.add(this.cracksGraphics);
    }

    const startTime = this.scene.time.now;
    const initialY = this.y;
    const initialX = this.x;

    const shakeEvent = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!this.scene || !this.active || !this.cracksGraphics) {
          shakeEvent.remove();
          return;
        }

        const elapsed = this.scene.time.now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress > 0.2) {
          const currentIntensity = NEAR_WIN_CONFIG.SHAKE_INTENSITY_START +
            (NEAR_WIN_CONFIG.SHAKE_INTENSITY_END - NEAR_WIN_CONFIG.SHAKE_INTENSITY_START) * progress;

          this.x = initialX + Phaser.Math.Between(-currentIntensity, currentIntensity);
          this.y = initialY + Phaser.Math.Between(-currentIntensity, currentIntensity);
        }

        if (progress > 0.3) {
          this.cracksGraphics.clear();
          this.cracksGraphics.lineStyle(3, 0x000000, 0.8);

          const w = this.image.displayWidth * 0.4;
          const numCracks = Math.floor(progress * 5) + 1;

          for(let i=0; i<numCracks; i++) {
            this.cracksGraphics.beginPath();
            this.cracksGraphics.moveTo(0, 0);
            const angle = (Math.PI * 2 * i) / 5;
            const len = w * progress * 1.5;
            this.cracksGraphics.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            this.cracksGraphics.strokePath();
          }
        }
      }
    });

    this.scene.time.delayedCall(duration, () => {
      if (!this.scene) return;

      shakeEvent.remove();
      this.x = initialX;
      this.y = initialY;

      this.emitParticles();
      this.setVisible(false);

      onComplete();
    });
  }

  private emitParticles() {
    if (!this.scene) return;
    const particles = this.scene.add.particles(this.x, this.y, 'platforma1', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 },
      lifespan: 600,
      gravityY: 800,
      quantity: 10,
      tint: 0x555555
    });
    this.scene.time.delayedCall(600, () => particles.destroy());
  }

  // --- FIX: Bezpieczne ustawianie Shadera ---
  public setDangerMode(active: boolean, intensity: number = 0.5) {
    if (active) {
      // Upewniamy się, że shader jest dodany
      if (!this.image.getPostPipeline('ShineFX')) {
        this.image.setPostPipeline('ShineFX');
      }

      // Pobieramy pipeline bezpiecznie
      const pipelineOrArray = this.image.getPostPipeline('ShineFX');

      // Phaser może zwrócić obiekt lub tablicę obiektów. Obsługujemy oba przypadki.
      let pipeline: any = null;

      if (Array.isArray(pipelineOrArray)) {
        if (pipelineOrArray.length > 0) pipeline = pipelineOrArray[0];
      } else {
        pipeline = pipelineOrArray;
      }

      // Ustawiamy wartość
      if (pipeline && typeof pipeline.set1f === 'function') {
        pipeline.set1f('uIntensity', intensity);
      }
    } else {
      this.image.removePostPipeline('ShineFX');
    }
  }
}