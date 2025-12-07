import Phaser from 'phaser';
import { LAYOUT } from '../config/Constants';

type PlayerState = 'idle' | 'jump' | 'lose';

export default class Player extends Phaser.GameObjects.Container {
  private vidIdle: Phaser.GameObjects.Video;
  private vidJump: Phaser.GameObjects.Video;
  private vidLose: Phaser.GameObjects.Video;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(10);

    const size = LAYOUT.PLAYER_SIZE;

    // Funkcja pomocnicza do tworzenia wideo z efektem usuwania tła
    const createVid = (key: string) => {
      const vid = scene.add.video(0, 0, key);
      vid.setOrigin(0.5, 0.5);
      vid.setDisplaySize(size, size);
      vid.setMute(true);
      // NAKŁADAMY SHADER USUWAJĄCY CZERŃ
      vid.setPostPipeline('RemoveBlack');
      return vid;
    };

    // --- 1. IDLE ---
    this.vidIdle = createVid('player_idle');
    this.vidIdle.play(true);

    // --- 2. JUMP ---
    this.vidJump = createVid('player_jump');
    this.vidJump.setVisible(false);

    // --- 3. LOSE ---
    this.vidLose = createVid('player_lose');
    this.vidLose.setVisible(false);

    this.add([this.vidIdle, this.vidJump, this.vidLose]);
  }

  private playState(state: PlayerState) {
    this.vidIdle.setVisible(false);
    this.vidJump.setVisible(false);
    this.vidLose.setVisible(false);

    switch (state) {
      case 'idle':
        this.vidIdle.setVisible(true);
        this.vidIdle.play(true);
        break;
      case 'jump':
        this.vidJump.setVisible(true);
        this.vidJump.play(true);
        break;
      case 'lose':
        this.vidLose.setVisible(true);
        this.vidLose.play(true);
        break;
    }
  }

  public resetState() {
    this.playState('idle');
    this.setRotation(0);
  }

  public jumpTo(targetX: number, targetY: number, onComplete: () => void) {
    const startX = this.x;
    const startY = this.y;

    const offset = (LAYOUT.PLATFORM_HEIGHT / 2) + (LAYOUT.PLAYER_SIZE / 2);
    const endY = targetY - offset;

    const controlX = (startX + targetX) / 2;
    const controlY = Math.min(startY, endY) - LAYOUT.JUMP_HEIGHT_OFFSET;

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(controlX, controlY),
      new Phaser.Math.Vector2(targetX, endY)
    );

    const direction = targetX > startX ? 1 : -1;

    this.playState('jump');

    // Animacja Squash & Stretch
    this.scene.tweens.add({
      targets: this, scaleX: 1.2, scaleY: 0.6, y: startY + 5, duration: 150, yoyo: true, ease: 'Power2',
      onComplete: () => {
        const progress = { t: 0 };

        this.scene.tweens.add({
          targets: this, angle: this.angle + (360 * direction), duration: 400,
        });

        this.scene.tweens.add({
          targets: progress, t: 1, duration: 400, ease: 'Quad.easeInOut',
          onUpdate: () => {
            const pos = curve.getPoint(progress.t);
            this.setPosition(pos.x, pos.y);
          },
          onComplete: () => {
            this.scene.cameras.main.shake(100, 0.01);
            this.playState('idle');
            onComplete();
          }
        });
      }
    });
  }

  public fallDown(onComplete: () => void) {
    this.playState('lose');

    this.scene.tweens.add({
      targets: this,
      y: this.scene.cameras.main.height + 200,
      angle: 180,
      duration: 600,
      ease: 'Quad.runIn',
      onComplete: onComplete
    });
  }
}