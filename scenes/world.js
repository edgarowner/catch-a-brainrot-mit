import { makeNPC } from "../entities/npc.js";
import { makePlayer } from "../entities/player.js";
import { makeDialogBox } from "../entities/dialogBox.js";
import { makeCamera } from "../entities/camera.js";
import { checkCollision, preventOverlap } from "../utils.js";

function rect(x, y, width, height, name = "") {
  return { x, y, width, height, name };
}

function drawTile(p, camera, x, y, color, border = null) {
  p.fill(color);
  p.noStroke();
  p.rect(Math.round(x + camera.x), Math.round(y + camera.y), 32, 32);
  if (border) {
    p.stroke(border);
    p.noFill();
    p.rect(Math.round(x + camera.x), Math.round(y + camera.y), 32, 32);
  }
}

function drawHouse(p, camera, x, y, color, label) {
  const sx = Math.round(x + camera.x);
  const sy = Math.round(y + camera.y);
  p.noStroke();
  p.fill("#5b2c2c");
  p.triangle(sx - 10, sy + 42, sx + 80, sy - 18, sx + 170, sy + 42);
  p.fill(color);
  p.rect(sx, sy + 38, 160, 112);
  p.fill("#2b1838");
  p.rect(sx + 64, sy + 100, 32, 50);
  p.fill("#9be7ff");
  p.rect(sx + 20, sy + 62, 34, 28);
  p.rect(sx + 106, sy + 62, 34, 28);
  p.fill("#ffe76b");
  p.textSize(14);
  p.text(label, sx + 22, sy + 30);
}

function drawTree(p, camera, x, y) {
  const sx = Math.round(x + camera.x);
  const sy = Math.round(y + camera.y);
  p.noStroke();
  p.fill("#6b3e18");
  p.rect(sx + 12, sy + 34, 16, 30);
  p.fill("#185c35");
  p.ellipse(sx + 20, sy + 24, 56, 48);
  p.fill("#2fad62");
  p.ellipse(sx + 8, sy + 16, 28, 24);
}

function drawWarpHint(p, camera, warp) {
  const sx = Math.round(warp.x + camera.x);
  const sy = Math.round(warp.y + camera.y);
  p.noStroke();
  p.fill("rgba(61,245,193,0.45)");
  p.rect(sx, sy, warp.width, warp.height);
}

const maps = {
  town: {
    spawn: { x: 500, y: 710 },
    npc: { x: 620, y: 514 },
    collisions: [
      rect(-64, -64, 1248, 64, "north edge"),
      rect(-64, 960, 1248, 64, "south edge"),
      rect(-64, -64, 64, 1088, "west edge"),
      rect(1152, -64, 64, 1088, "east edge"),
      rect(180, 140, 160, 150, "rizz cafe"),
      rect(770, 130, 160, 150, "sigma shop"),
      rect(170, 610, 160, 150, "meme lab"),
      rect(760, 625, 160, 150, "brainrot house"),
      rect(420, 150, 80, 290, "pond"),
      rect(500, 150, 180, 80, "pond"),
      rect(250, 430, 60, 52, "statue"),
      rect(840, 420, 60, 52, "fountain"),
      rect(0, 0, 1152, 44, "tree line"),
      rect(0, 916, 1152, 44, "tree line"),
    ],
    warps: [
      rect(214, 234, 92, 72, "cafe"),
      rect(794, 224, 92, 72, "shop"),
      rect(204, 704, 92, 72, "lab"),
      rect(794, 718, 92, 72, "home"),
    ],
  },
  house: {
    spawn: { x: 256, y: 286 },
    collisions: [
      rect(70, 62, 372, 34, "top wall"),
      rect(70, 320, 372, 34, "bottom wall"),
      rect(70, 62, 34, 292, "left wall"),
      rect(408, 62, 34, 292, "right wall"),
      rect(112, 112, 84, 58, "sofa"),
      rect(298, 106, 74, 74, "pc desk"),
      rect(134, 230, 72, 48, "table"),
      rect(286, 230, 84, 56, "bed"),
    ],
    warps: [rect(202, 292, 124, 64, "exit")],
  },
};

export function makeWorld(p, setScene) {
  return {
    camera: makeCamera(p, 100, 0),
    player: makePlayer(p, 0, 0),
    npc: makeNPC(p, 0, 0),
    dialogBox: makeDialogBox(p, 0, 280),
    currentMap: "town",
    lastTownExit: maps.town.spawn,
    warpCooldown: 0,
    makeScreenFlash: false,
    alpha: 0,
    blinkBack: false,
    easing: 3,

    load() {
      this.dialogBox.load();
      this.player.load();
      this.npc.load();
    },

    setup() {
      this.player.x = maps.town.spawn.x;
      this.player.y = maps.town.spawn.y;
      this.player.setup();
      this.camera.attachTo(this.player);
      this.npc.x = maps.town.npc.x;
      this.npc.y = maps.town.npc.y;
      this.npc.setup();
    },

    applyCollisions() {
      for (const boundary of maps[this.currentMap].collisions) {
        if (checkCollision(boundary, this.player)) preventOverlap(boundary, this.player);
      }
    },

    checkWarps() {
      if (this.warpCooldown > 0) return;
      for (const warp of maps[this.currentMap].warps) {
        if (!checkCollision(warp, this.player)) continue;
        if (this.currentMap === "town") {
          this.lastTownExit = { x: warp.x, y: warp.y + 62 };
          this.currentMap = "house";
          this.player.x = maps.house.spawn.x;
          this.player.y = maps.house.spawn.y;
          this.dialogBox.displayTextImmediately(`Entered ${warp.name.toUpperCase()} HOUSE.`);
          this.dialogBox.setVisibility(true);
        } else {
          this.currentMap = "town";
          this.player.x = this.lastTownExit.x;
          this.player.y = this.lastTownExit.y;
          this.dialogBox.setVisibility(false);
        }
        this.warpCooldown = 30;
        break;
      }
    },

    update() {
      this.camera.update();
      this.player.update();
      // Warps run before solid collisions so door tiles can sit inside building walls.
      this.checkWarps();
      this.applyCollisions();
      if (this.warpCooldown > 0) this.warpCooldown--;
      if (this.currentMap === "town") this.npc.update();
      this.dialogBox.update();

      if (this.alpha <= 0) this.blinkBack = true;
      if (this.alpha >= 255) this.blinkBack = false;
      this.alpha += (this.blinkBack ? 0.7 : -0.7) * this.easing * p.deltaTime;
    },

    drawTown() {
      p.background("#67c66b");
      for (let y = 0; y < 960; y += 32) {
        for (let x = 0; x < 1152; x += 32) {
          const checker = (x / 32 + y / 32) % 2 === 0;
          drawTile(p, this.camera, x, y, checker ? "#69cf70" : "#5fc466");
        }
      }
      for (let x = 0; x < 1152; x += 32) drawTile(p, this.camera, x, 480, "#d6b56d");
      for (let y = 96; y < 864; y += 32) drawTile(p, this.camera, 544, y, "#d6b56d");
      for (let x = 128; x < 1024; x += 64) drawTree(p, this.camera, x, 16);
      for (let x = 32; x < 1088; x += 64) drawTree(p, this.camera, x, 888);
      p.fill("#347ac7");
      p.rect(420 + this.camera.x, 150 + this.camera.y, 260, 160);
      p.fill("#45a7f5");
      p.ellipse(550 + this.camera.x, 230 + this.camera.y, 210, 110);
      drawHouse(p, this.camera, 180, 140, "#ef5d5d", "RIZZ CAFE");
      drawHouse(p, this.camera, 770, 130, "#6bc9ff", "SIGMA SHOP");
      drawHouse(p, this.camera, 170, 610, "#b983ff", "MEME LAB");
      drawHouse(p, this.camera, 760, 625, "#ffcc4d", "HOME");
      p.fill("#69503a");
      p.rect(250 + this.camera.x, 430 + this.camera.y, 60, 52);
      p.fill("#f2f2f2");
      p.textSize(12);
      p.text("BRAINROT\nPLAZA", 252 + this.camera.x, 450 + this.camera.y);
      p.fill("#45a7f5");
      p.ellipse(870 + this.camera.x, 446 + this.camera.y, 72, 52);
      for (const warp of maps.town.warps) drawWarpHint(p, this.camera, warp);
    },

    drawHouseInterior() {
      p.background("#10121f");
      for (let y = 64; y < 352; y += 32) {
        for (let x = 64; x < 448; x += 32) drawTile(p, this.camera, x, y, "#8bd2ff", "#6ca6d8");
      }
      p.fill("#493062");
      p.rect(70 + this.camera.x, 62 + this.camera.y, 372, 34);
      p.rect(70 + this.camera.x, 320 + this.camera.y, 372, 34);
      p.rect(70 + this.camera.x, 62 + this.camera.y, 34, 292);
      p.rect(408 + this.camera.x, 62 + this.camera.y, 34, 292);
      p.fill("#ff7ccf");
      p.rect(112 + this.camera.x, 112 + this.camera.y, 84, 58);
      p.fill("#38206b");
      p.rect(298 + this.camera.x, 106 + this.camera.y, 74, 74);
      p.fill("#3df5c1");
      p.rect(306 + this.camera.x, 114 + this.camera.y, 44, 30);
      p.fill("#d99623");
      p.rect(134 + this.camera.x, 230 + this.camera.y, 72, 48);
      p.fill("#ffe76b");
      p.rect(286 + this.camera.x, 230 + this.camera.y, 84, 56);
      drawWarpHint(p, this.camera, maps.house.warps[0]);
      p.fill("#fff");
      p.textSize(16);
      p.text("BRAINROT SAFE HOUSE", 160 + this.camera.x, 88 + this.camera.y);
    },

    draw() {
      p.clear();
      if (this.currentMap === "town") this.drawTown();
      if (this.currentMap === "house") this.drawHouseInterior();

      if (this.currentMap === "town") {
        this.npc.draw(this.camera);
        this.npc.handleCollisionsWith(this.player, () => {
          this.dialogBox.displayText("You found a rare wild brainrot.\nLet's battle!", async () => {
            await new Promise((resolve) => setTimeout(resolve, 700));
            this.dialogBox.setVisibility(false);
            this.makeScreenFlash = true;
            await new Promise((resolve) => setTimeout(resolve, 700));
            this.makeScreenFlash = false;
            setScene("battle");
          });
          this.dialogBox.setVisibility(true);
        });
      }

      this.player.draw(this.camera);
      this.dialogBox.draw();

      if (this.makeScreenFlash) {
        p.fill(0, 0, 0, this.alpha);
        p.rect(0, 0, 512, 384);
      }
    },

    keyReleased() {
      for (const key of [p.RIGHT_ARROW, p.LEFT_ARROW, p.UP_ARROW, p.DOWN_ARROW]) {
        if (p.keyIsDown(key)) return;
      }
      switch (this.player.direction) {
        case "up": this.player.setAnim("idle-up"); break;
        case "down": this.player.setAnim("idle-down"); break;
        case "left":
        case "right": this.player.setAnim("idle-side"); break;
        default:
      }
    },
  };
}
