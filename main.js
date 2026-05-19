import { makeMenu } from "./scenes/menu.js";
import { debugMode } from "./entities/debugMode.js";
import { makeWorld } from "./scenes/world.js?v=6";
import { makeBattle } from "./scenes/battle.js?v=6";

new p5((p) => {
  let font;
  const scenes = ["menu", "world", "battle"];
  let currentScene = "menu";
  function setScene(name) {
    if (scenes.includes(name)) {
      currentScene = name;
      document.body.dataset.scene = name;
    }
  }

  const menu = makeMenu(p);
  const world = makeWorld(p, setScene);
  const battle = makeBattle(p);
  function handleGameKey(keyEvent) {
    if (keyEvent.key === "Shift") {
      debugMode.toggle();
    }

    if ((keyEvent.keyCode === p.ENTER || keyEvent.key === "Enter") && currentScene === "menu")
      setScene("world");

    if (currentScene === "world") world.onKeyPressed(keyEvent);
    if (currentScene === "battle") battle.onKeyPressed(keyEvent);
  }
  window.__catchABrainrot = {
    world,
    setScene,
    tapKey: (key) => handleGameKey({ key, keyCode: key === "Enter" ? p.ENTER : undefined }),
  };

  p.preload = () => {
    font = p.loadFont("./assets/power-clear.ttf");
    world.load();
    menu.load();
    battle.load();
  };

  p.setup = () => {
    const canvasEl = p.createCanvas(512, 384, document.getElementById("game"));
    // make canvas sharper temporarly
    p.pixelDensity(3);
    canvasEl.canvas.style = "";

    p.textFont(font);
    p.noSmooth(); // for pixels to not become blurry

    world.setup();
    battle.setup();
    document.body.dataset.scene = currentScene;
  };

  p.draw = () => {
    switch (currentScene) {
      case "menu":
        menu.update();
        menu.draw();
        break;
      case "world":
        world.update();
        world.draw();
        break;
      case "battle":
        battle.update();
        battle.draw();
        break;
      default:
    }

    debugMode.drawFpsCounter(p);
  };

  p.keyPressed = (keyEvent) => {
    handleGameKey(keyEvent);
  };

  p.keyReleased = () => {
    if (currentScene === "world") {
      world.keyReleased();
    }
  };
});
