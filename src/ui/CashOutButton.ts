import Phaser from 'phaser';
import { LAYOUT } from '../config/Constants';

export class CashOutButton extends Phaser.GameObjects.Container {
  private btnImage: Phaser.GameObjects.Image;
  private pulsateEvent: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, onClick: () => void) {
    super(scene, x, y);

    // Dodajemy obrazek zamiast prostokąta
    this.btnImage = scene.add.image(0, 0, 'btn-cashout');

    // Skalujemy obrazek do wymiarów zdefiniowanych w LAYOUT
    this.btnImage.setDisplaySize(LAYOUT.BTN_WIDTH, LAYOUT.BTN_HEIGHT);

    // Interaktywność na obrazku
    this.btnImage.setInteractive({ useHandCursor: true });

    // Nie dodajemy tekstu, bo jest już w grafice przycisku

    this.add(this.btnImage);

    this.btnImage.on('pointerdown', onClick);
    scene.add.existing(this);

    // Animacja pulsowania
    this.pulsateEvent = scene.tweens.add({
      targets: this,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public setEnabled(enabled: boolean) {
    this.setAlpha(enabled ? 1 : 0);

    if (enabled) {
      this.btnImage.setInteractive();
      // Reset koloru na domyślny
      this.btnImage.clearTint();
      if(this.pulsateEvent?.isPaused()) this.pulsateEvent.resume();
    } else {
      this.btnImage.disableInteractive();
      // Opcjonalnie: można wyszarzyć przycisk
      this.btnImage.setTint(0x888888);
      this.pulsateEvent?.pause();
      this.setScale(1);
    }
  }
}