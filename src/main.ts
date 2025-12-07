import Phaser from "phaser";
import { Game } from "./scenes/Game";
import './style.css'
import { GAME_DIMENSIONS } from "./config/Constants";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, // Dopasuj grę do okna zachowując proporcje
        autoCenter: Phaser.Scale.CENTER_BOTH, // Wycentruj
        width: GAME_DIMENSIONS.width,
        height: GAME_DIMENSIONS.height,
    },
    width: GAME_DIMENSIONS.width,
    height: GAME_DIMENSIONS.height,
    backgroundColor: "#222",
    parent: 'app',
    scene: [Game],
};

export default new Phaser.Game(config);