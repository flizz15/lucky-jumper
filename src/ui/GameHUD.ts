// src/ui/GameHUD.ts
import Phaser from 'phaser';
import { COLORS, GAME_DIMENSIONS, GAME_SETTINGS, LAYOUT } from '../config/Constants';

export class GameHUD extends Phaser.GameObjects.Container {
  private panel: Phaser.GameObjects.Image;
  private levelText: Phaser.GameObjects.Text;
  private multiplierText: Phaser.GameObjects.Text;
  private winText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const { width } = GAME_DIMENSIONS;

    // --- PANEL TŁA (Zamiast Rect używamy Image) ---
    // Ustawiamy go na środku w poziomie, i lekko w dół w pionie
    this.panel = scene.add.image(LAYOUT.CENTER_X, LAYOUT.HUD_HEIGHT / 2, 'panel');

    // Skalujemy panel, aby pasował do szerokości ekranu (z lekkim marginesem lub na full)
    // Jeśli panel.png jest mały, rozciągamy go.
    this.panel.setDisplaySize(width, LAYOUT.HUD_HEIGHT);

    this.add(this.panel);

    // --- STYLE CZCIONEK ---
    const fontSize = Math.floor(width * 0.035); // Nieco większa czcionka
    const fontPrimary = '"Luckiest Guy", "Comic Sans MS", fantasy';

    // Wspólny styl dla tekstów (gruby obrys, żeby było widać na drewnie)
    const baseStyle = {
      fontFamily: fontPrimary,
      fontSize: `${fontSize}px`,
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true }
    };

    // Marginesy
    const marginSide = width * 0.04;
    const textY = LAYOUT.HUD_HEIGHT / 2; // Tekst wycentrowany w pionie na panelu

    // --- TEKSTY ---

    // Lewa strona: Level
    this.levelText = scene.add.text(marginSide, textY, '', {
      ...baseStyle,
      color: COLORS.TEXT_WHITE
    }).setOrigin(0, 0.5); // Lewy-Środek

    // Środek: Mnożnik (trochę większy)
    this.multiplierText = scene.add.text(LAYOUT.CENTER_X, textY, '', {
      ...baseStyle,
      fontSize: `${fontSize * 1.2}px`,
      color: COLORS.TEXT_GOLD
    }).setOrigin(0.5, 0.5); // Idealny środek

    // Prawa strona: Wygrana
    this.winText = scene.add.text(width - marginSide, textY, '', {
      ...baseStyle,
      fontSize: `${fontSize * 1.3}px`,
      color: COLORS.TEXT_GREEN
    }).setOrigin(1, 0.5); // Prawy-Środek

    this.add([this.levelText, this.multiplierText, this.winText]);
    scene.add.existing(this);
    this.setDepth(100);
  }

  public updateStats(level: number, multiplier: number, potentialWin: number) {
    const displayLevel = Math.min(level + 1, GAME_SETTINGS.MAX_LEVELS);

    this.levelText.setText(`LVL ${displayLevel}/${GAME_SETTINGS.MAX_LEVELS}`);
    this.multiplierText.setText(`x${multiplier.toFixed(2)}`);
    this.winText.setText(`${potentialWin} PLN`);

    // Zmiana koloru wygranej (np. szary jak 0, zielony jak wygrywamy)
    if (multiplier > 1) {
      this.winText.setColor(COLORS.TEXT_GREEN);
    } else {
      this.winText.setColor('#cccccc'); // Szary na start
    }
  }
}