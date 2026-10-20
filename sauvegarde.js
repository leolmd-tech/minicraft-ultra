// sauvegarde.js - Systeme de sauvegarde LocalStorage

const SaveSystem = {
  SAVE_KEY: "minicraft_ultra_save",

  saveGame: function() {
    let modifiedBlocks = [];
    for (let [key, chunk] of ChunkManager.chunks.entries()) {
      if (chunk.isDirty) {
        modifiedBlocks.push({
          cx: chunk.cx,
          cz: chunk.cz,
          blocks: Array.from(chunk.blocks)
        });
      }
    }

    let saveData = {
      seed: WorldGen.currentSeed,
      player: {
        x: mainPlayer.position.x,
        y: mainPlayer.position.y,
        z: mainPlayer.position.z,
        health: mainPlayer.health,
        hunger: mainPlayer.hunger
      },
      time: Engine.worldTime,
      inventory: playerInventory.slots
    };

    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
    console.log("Jeu sauvegarde avec succes !");
  },

  loadGame: function() {
    let json = localStorage.getItem(this.SAVE_KEY);
    if (!json) return false;

    let saveData = JSON.parse(json);
    WorldGen.setSeed(saveData.seed);

    mainPlayer.position.set(saveData.player.x, saveData.player.y, saveData.player.z);
    mainPlayer.health = saveData.player.health;
    mainPlayer.hunger = saveData.player.hunger;
    Engine.worldTime = saveData.time;

    if (saveData.inventory) {
      playerInventory.slots = saveData.inventory;
      playerInventory.render();
    }

    ChunkManager.updateAroundPlayer(mainPlayer.position.x, mainPlayer.position.z);
    return true;
  }
};
