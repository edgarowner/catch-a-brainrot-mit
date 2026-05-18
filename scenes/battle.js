import { makeDialogBox } from "../entities/dialogBox.js";

const states = {
  default: "default",
  introNpc: "intro-npc",
  introNpcBrainrot: "intro-npc-brainrot",
  introPlayerBrainrot: "intro-player-brainrot",
  playerTurn: "player-turn",
  playerAttack: "player-attack",
  npcTurn: "npc-turn",
  battleEnd: "battle-end",
  winnerDeclared: "winner-declared",
};

function makeBrainrot(name, x, finalX, y, maxHp, attacks, dataBox) {
  return {
    name,
    finalX,
    x,
    y,
    spriteRef: null,
    maxHp,
    hp: maxHp,
    attacks,
    selectedAttack: null,
    isFainted: false,
    dataBox,
  };
}

function makeDataBox(x, y, nameX, nameY, healthBarX, healthBarY) {
  return {
    x,
    y,
    nameOffset: {
      x: nameX,
      y: nameY,
    },
    healthBarOffset: {
      x: healthBarX,
      y: healthBarY,
    },
    spriteRef: null,
    maxHealthBarLength: 96,
    healthBarLength: 96,
  };
}

export function makeBattle(p) {
  return {
    dialogBox: makeDialogBox(p, 0, 288),
    currentState: "default",
    npc: {
      x: 350,
      y: 20,
      spriteRef: null,
    },
    npcBrainrot: makeBrainrot(
      "TRALALERO",
      600,
      310,
      20,
      100,
      [
        { name: "SKIBIDI HIT", power: 12 },
        { name: "ESPRESSO SPLASH", power: 42 },
        { name: "RIZZ KICK", power: 38 },
        { name: "SIGMA ROAR", power: 35 },
      ],
      makeDataBox(-300, 40, 15, 30, 118, 40)
    ),
    playerBrainrot: makeBrainrot(
      "BOMBARDIRO",
      -170,
      20,
      128,
      100,
      [
        { name: "SKIBIDI HIT", power: 16 },
        { name: "RIZZ BEAM", power: 40 },
        { name: "CATCH", power: 30 },
        { name: "SIGMA ROAR", power: 36 },
      ],
      makeDataBox(510, 220, 38, 30, 136, 40)
    ),
    drawDataBox(brainrot) {
      p.image(brainrot.dataBox.spriteRef, brainrot.dataBox.x, brainrot.dataBox.y);
      p.text(
        brainrot.name,
        brainrot.dataBox.x + brainrot.dataBox.nameOffset.x,
        brainrot.dataBox.y + brainrot.dataBox.nameOffset.y
      );

      p.push();
      p.angleMode(p.DEGREES);
      p.rotate(360);
      p.noStroke();
      if (brainrot.dataBox.healthBarLength > 50) {
        p.fill(0, 200, 0);
      }
      if (brainrot.dataBox.healthBarLength < 50) {
        p.fill(255, 165, 0);
      }
      if (brainrot.dataBox.healthBarLength < 20) {
        p.fill(200, 0, 0);
      }
      p.rect(
        brainrot.dataBox.x + brainrot.dataBox.healthBarOffset.x,
        brainrot.dataBox.y + brainrot.dataBox.healthBarOffset.y,
        brainrot.dataBox.healthBarLength,
        6
      );
      p.pop();
    },
    async dealDamage(targetBrainrot, attackingBrainrot) {
      targetBrainrot.hp -= attackingBrainrot.selectedAttack.power;
      if (targetBrainrot.hp > 0) {
        targetBrainrot.dataBox.healthBarLength =
          (targetBrainrot.hp * targetBrainrot.dataBox.maxHealthBarLength) /
          targetBrainrot.maxHp;
        return;
      }
      targetBrainrot.dataBox.healthBarLength = 0;
      targetBrainrot.isFainted = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.currentState = states.battleEnd;
    },
    load() {
      this.battleBackgroundImage = p.loadImage("assets/battle-background.png");
      this.npc.spriteRef = p.loadImage("assets/MEMELORD.png");
      this.npcBrainrot.spriteRef = p.loadImage("assets/TRALALERO.png");
      this.playerBrainrot.spriteRef = p.loadImage("assets/BOMBARDIRO.png");
      this.playerBrainrot.dataBox.spriteRef = p.loadImage(
        "assets/databox_thin.png"
      );
      this.npcBrainrot.dataBox.spriteRef = p.loadImage(
        "assets/databox_thin_foe.png"
      );
      this.dialogBox.load();
    },
    setup() {
      this.dialogBox.displayText(
        "Mark the meme lord wants to battle !",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          this.currentState = states.introNpc;
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `He sends out ${this.npcBrainrot.name} !`,
            async () => {
              this.currentState = states.introNpcBrainrot;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.dialogBox.displayText(
                `Go! ${this.playerBrainrot.name} !`,
                async () => {
                  this.currentState = states.introPlayerBrainrot;
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  this.dialogBox.clearText();
                  this.dialogBox.displayText(
                    `What will ${this.playerBrainrot.name} do ?`,
                    async () => {
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      this.currentState = states.playerTurn;
                    }
                  );
                }
              );
            }
          );
        }
      );
      this.dialogBox.setVisibility(true);
    },
    update() {
      if (this.currentState === states.introNpc) {
        this.npc.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introNpcBrainrot &&
        this.npcBrainrot.x >= this.npcBrainrot.finalX
      ) {
        this.npcBrainrot.x -= 0.5 * p.deltaTime;
        if (this.npcBrainrot.dataBox.x <= 0)
          this.npcBrainrot.dataBox.x += 0.5 * p.deltaTime;
      }

      if (
        this.currentState === states.introPlayerBrainrot &&
        this.playerBrainrot.x <= this.playerBrainrot.finalX
      ) {
        this.playerBrainrot.x += 0.5 * p.deltaTime;
        this.playerBrainrot.dataBox.x -= 0.65 * p.deltaTime;
      }

      if (this.playerBrainrot.isFainted) {
        this.playerBrainrot.y += 0.8 * p.deltaTime;
      }

      if (this.npcBrainrot.isFainted) {
        this.npcBrainrot.y += 0.8 * p.deltaTime;
      }

      this.dialogBox.update();
    },
    draw() {
      p.clear();
      p.background(0);
      p.image(this.battleBackgroundImage, 0, 0);

      p.image(this.npcBrainrot.spriteRef, this.npcBrainrot.x, this.npcBrainrot.y);

      this.drawDataBox(this.npcBrainrot);

      p.image(
        this.playerBrainrot.spriteRef,
        this.playerBrainrot.x,
        this.playerBrainrot.y
      );

      this.drawDataBox(this.playerBrainrot);

      if (
        this.currentState === states.default ||
        this.currentState === states.introNpc
      )
        p.image(this.npc.spriteRef, this.npc.x, this.npc.y);

      if (
        this.currentState === states.playerTurn &&
        !this.playerBrainrot.selectedAttack
      ) {
        this.dialogBox.displayTextImmediately(
          `1) ${this.playerBrainrot.attacks[0].name}    3) ${this.playerBrainrot.attacks[2].name}\n2) ${this.playerBrainrot.attacks[1].name}   4) ${this.playerBrainrot.attacks[3].name}`
        );
      }

      if (
        this.currentState === states.playerTurn &&
        this.playerBrainrot.selectedAttack &&
        !this.playerBrainrot.isAttacking &&
        !this.playerBrainrot.isFainted
      ) {
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `${this.playerBrainrot.name} used ${this.playerBrainrot.selectedAttack.name} !`,
          async () => {
            await this.dealDamage(this.npcBrainrot, this.playerBrainrot);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.dialogBox.clearText();
              this.currentState = states.npcTurn;
            }
          }
        );
        this.playerBrainrot.isAttacking = true;
      }

      if (this.currentState === states.npcTurn && !this.npcBrainrot.isFainted) {
        this.npcBrainrot.selectedAttack =
          this.npcBrainrot.attacks[
            Math.floor(Math.random() * this.npcBrainrot.attacks.length)
          ];
        this.dialogBox.clearText();
        this.dialogBox.displayText(
          `The wild ${this.npcBrainrot.name} used ${this.npcBrainrot.selectedAttack.name} !`,
          async () => {
            await this.dealDamage(this.playerBrainrot, this.npcBrainrot);
            if (this.currentState !== states.battleEnd) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              this.playerBrainrot.selectedAttack = null;
              this.playerBrainrot.isAttacking = false;
            }
          }
        );
        this.currentState = states.playerTurn;
      }

      if (this.currentState === states.battleEnd) {
        if (this.npcBrainrot.isFainted) {
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.npcBrainrot.name} was caught ! You won !`
          );
          this.currentState = states.winnerDeclared;
          return;
        }

        if (this.playerBrainrot.isFainted) {
          this.dialogBox.clearText();
          this.dialogBox.displayText(
            `${this.playerBrainrot.name} got ratio'd ! You lost !`
          );
          this.currentState = states.winnerDeclared;
        }
      }

      p.rect(0, 288, 512, 200);
      this.dialogBox.draw();
    },
    onKeyPressed(keyEvent) {
      if (this.currentState === states.playerTurn) {
        switch (keyEvent.key) {
          case "1":
            this.playerBrainrot.selectedAttack = this.playerBrainrot.attacks[0];
            break;
          case "2":
            this.playerBrainrot.selectedAttack = this.playerBrainrot.attacks[1];
            break;
          case "3":
            this.playerBrainrot.selectedAttack = this.playerBrainrot.attacks[2];
            break;
          case "4":
            this.playerBrainrot.selectedAttack = this.playerBrainrot.attacks[3];
            break;
          default:
        }
      }
    },
  };
}
