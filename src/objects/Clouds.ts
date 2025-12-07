import Phaser from 'phaser';
import { GAME_DIMENSIONS } from '../config/Constants';

export class Clouds {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.Image[] = [];
  private readonly CLOUD_COUNT = 15;
  private currentLevel: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createElements();
  }

  public setLevel(level: number) {
    this.currentLevel = level;
  }

  private createElements() {
    for (let i = 0; i < this.CLOUD_COUNT; i++) {
      this.spawnElement(true);
    }
  }

  private spawnElement(randomY: boolean = false) {
    const roll = Math.random();
    let textureKey: string;
    let scaleMultiplier: number = 1.0;
    let isCoin = false;

    const highStakesChance = Math.max(0, (this.currentLevel - 5) * 0.08);

    if (this.currentLevel >= 6 && roll < highStakesChance) {
      textureKey = 'coin_particle';
      scaleMultiplier = 1.5;
      isCoin = true;
    } else if (roll < 0.05) {
      textureKey = 'garniec';
      scaleMultiplier = 0.8;
    } else if (roll < 0.15) {
      textureKey = 'tecza';
      scaleMultiplier = 1.2;
    } else {
      textureKey = `chmura${Phaser.Math.Between(1, 4)}`;
      scaleMultiplier = 1.0;
    }

    const x = Phaser.Math.Between(0, GAME_DIMENSIONS.width);
    let y;
    if (randomY) {
      y = Phaser.Math.Between(0, GAME_DIMENSIONS.height);
    } else {
      y = Phaser.Math.Between(-200, -100);
    }

    const element = this.scene.add.image(x, y, textureKey);
    const depth = Phaser.Math.Between(-9, -5);
    element.setDepth(depth);
    element.clearTint(); // WAŻNE: Reset tintu na starcie

    const baseScale = Phaser.Math.FloatBetween(0.4, 0.9);
    element.setScale(baseScale * scaleMultiplier);

    if (isCoin) {
      element.setAlpha(0.9);
      element.setTint(0xFFD700);
    } else if (textureKey === 'tecza' || textureKey === 'garniec') {
      element.setAlpha(0.9);
    } else {
      element.setAlpha(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    const direction = Math.random() > 0.5 ? 1 : -1;
    const speedX = Phaser.Math.FloatBetween(0.2, 0.6) * direction * (isCoin ? 1.5 : 1);

    element.setData('speedX', speedX);
    element.setData('parallaxFactor', baseScale * 0.5);
    element.setData('isCoin', isCoin);

    if (isCoin) {
      element.setAngle(Phaser.Math.Between(0, 360));
      element.setData('rotationSpeed', Phaser.Math.FloatBetween(0.5, 2.0) * direction);
    }

    this.elements.push(element);
  }

  public update() {
    this.elements.forEach(el => {
      el.x += el.getData('speedX');

      if (el.getData('isCoin')) {
        el.angle += el.getData('rotationSpeed');
      }

      const buffer = 200;
      if (el.x > GAME_DIMENSIONS.width + buffer) {
        el.x = -buffer;
      } else if (el.x < -buffer) {
        el.x = GAME_DIMENSIONS.width + buffer;
      }
    });
  }

  public tweenVertical(amount: number, duration: number) {
    this.elements.forEach(el => {
      const factor = el.getData('parallaxFactor');
      const moveDistance = amount * factor;

      this.scene.tweens.add({
        targets: el,
        y: `+=${moveDistance}`,
        duration: duration,
        ease: 'Cubic.out',
        onComplete: () => {
          if (el.y > GAME_DIMENSIONS.height + 200) {
            this.resetElementToTop(el);
          }
        }
      });
    });
  }

  private resetElementToTop(element: Phaser.GameObjects.Image) {
    element.y = Phaser.Math.Between(-200, -100);
    element.x = Phaser.Math.Between(0, GAME_DIMENSIONS.width);

    const roll = Math.random();
    let textureKey: string;
    let scaleMultiplier: number = 1.0;
    let isCoin = false;

    const highStakesChance = Math.max(0, (this.currentLevel - 5) * 0.08);

    if (this.currentLevel >= 6 && roll < highStakesChance) {
      textureKey = 'coin_particle';
      scaleMultiplier = 1.5;
      isCoin = true;
    } else if (roll < 0.05) {
      textureKey = 'garniec';
      scaleMultiplier = 0.8;
    } else if (roll < 0.15) {
      textureKey = 'tecza';
      scaleMultiplier = 1.2;
    } else {
      textureKey = `chmura${Phaser.Math.Between(1, 4)}`;
      scaleMultiplier = 1.0;
    }

    element.setTexture(textureKey);
    element.clearTint(); // WAŻNE: Reset tintu przy recyklingu

    const baseScale = Phaser.Math.FloatBetween(0.4, 0.9);
    element.setScale(baseScale * scaleMultiplier);

    if (isCoin) {
      element.setAlpha(0.9);
      element.setTint(0xFFD700);
      element.setAngle(Phaser.Math.Between(0, 360));
      element.setData('rotationSpeed', Phaser.Math.FloatBetween(0.5, 2.0) * (Math.random()>0.5?1:-1));
    } else if (textureKey === 'tecza' || textureKey === 'garniec') {
      element.setAlpha(0.9);
    } else {
      element.setAlpha(Phaser.Math.FloatBetween(0.4, 0.8));
    }

    const direction = Math.random() > 0.5 ? 1 : -1;
    const speedX = Phaser.Math.FloatBetween(0.2, 0.6) * direction * (isCoin ? 1.5 : 1);

    element.setData('speedX', speedX);
    element.setData('parallaxFactor', baseScale * 0.5);
    element.setData('isCoin', isCoin);
  }

  public resetAll() {
    this.currentLevel = 0;
    this.elements.forEach(c => c.destroy());
    this.elements = [];
    this.createElements();
  }
}