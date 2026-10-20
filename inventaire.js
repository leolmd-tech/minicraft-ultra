// inventaire.js - Systemes d'inventaire (36 slots + 9 hotbar), Outils, Durabilite, Casser/Poser des blocs

const ITEMS = {
  // Blocs
  DIRT: { id: 1, name: "Terre", isBlock: true, blockId: BLOCKS.DIRT, hardness: 0.5, tool: "shovel", maxStack: 64, icon: "🟫" },
  GRASS: { id: 2, name: "Herbe", isBlock: true, blockId: BLOCKS.GRASS, hardness: 0.6, tool: "shovel", maxStack: 64, icon: "🟩" },
  STONE: { id: 3, name: "Pierre", isBlock: true, blockId: BLOCKS.STONE, hardness: 1.5, tool: "pickaxe", reqTier: 1, maxStack: 64, icon: "🩶" },
  SAND: { id: 4, name: "Sable", isBlock: true, blockId: BLOCKS.SAND, hardness: 0.5, tool: "shovel", maxStack: 64, icon: "🟨" },
  WOOD: { id: 5, name: "Bois", isBlock: true, blockId: BLOCKS.WOOD, hardness: 1.2, tool: "axe", maxStack: 64, icon: "🪵" },
  LEAVES: { id: 6, name: "Feuilles", isBlock: true, blockId: BLOCKS.LEAVES, hardness: 0.2, maxStack: 64, icon: "🌿" },
  PLANKS: { id: 7, name: "Planches", isBlock: true, blockId: BLOCKS.PLANKS, hardness: 1.0, tool: "axe", maxStack: 64, icon: "📦" },
  GLASS: { id: 8, name: "Verre", isBlock: true, blockId: BLOCKS.GLASS, hardness: 0.3, maxStack: 64, icon: "🔲" },
  BRICKS: { id: 9, name: "Briques", isBlock: true, blockId: BLOCKS.BRICKS, hardness: 2.0, tool: "pickaxe", reqTier: 1, maxStack: 64, icon: "🧱" },
  ORE_COAL: { id: 10, name: "Minerai de Charbon", isBlock: true, blockId: BLOCKS.ORE_COAL, hardness: 2.0, tool: "pickaxe", reqTier: 1, maxStack: 64, icon: "⬛" },
  ORE_IRON: { id: 11, name: "Minerai de Fer", isBlock: true, blockId: BLOCKS.ORE_IRON, hardness: 3.0, tool: "pickaxe", reqTier: 2, maxStack: 64, icon: "⚙️" },
  ORE_GOLD: { id: 12, name: "Minerai d'Or", isBlock: true, blockId: BLOCKS.ORE_GOLD, hardness: 3.0, tool: "pickaxe", reqTier: 3, maxStack: 64, icon: "🟡" },
  ORE_DIAMOND: { id: 13, name: "Minerai de Diamant", isBlock: true, blockId: BLOCKS.ORE_DIAMOND, hardness: 4.0, tool: "pickaxe", reqTier: 3, maxStack: 64, icon: "💎" },
  SNOW: { id: 15, name: "Neige", isBlock: true, blockId: BLOCKS.SNOW, hardness: 0.3, tool: "shovel", maxStack: 64, icon: "❄️" },
  CACTUS: { id: 16, name: "Cactus", isBlock: true, blockId: BLOCKS.CACTUS, hardness: 0.4, maxStack: 64, icon: "🌵" },
  WORKBENCH: { id: 17, name: "Table de Craft", isBlock: true, blockId: BLOCKS.WORKBENCH, hardness: 1.5, tool: "axe", maxStack: 64, icon: "🛠️" },
  FURNACE: { id: 18, name: "Four", isBlock: true, blockId: BLOCKS.FURNACE, hardness: 2.5, tool: "pickaxe", reqTier: 1, maxStack: 64, icon: "🔥" },

  // Matériaux / Drops
  STICK: { id: 30, name: "Bâton", maxStack: 64, icon: "🥢" },
  COAL: { id: 31, name: "Charbon", maxStack: 64, icon: "🖤" },
  IRON_INGOT: { id: 32, name: "Lingot de Fer", maxStack: 64, icon: "⚪" },
  GOLD_INGOT: { id: 33, name: "Lingot d'Or", maxStack: 64, icon: "🪙" },
  DIAMOND: { id: 34, name: "Diamant", maxStack: 64, icon: "💎" },
  RAW_MEAT: { id: 35, name: "Viande crue", foodValue: 4, maxStack: 64, icon: "🥩" },
  COOKED_MEAT: { id: 36, name: "Viande cuite", foodValue: 8, maxStack: 64, icon: "🍗" },
  APPLE: { id: 37, name: "Pomme", foodValue: 4, maxStack: 64, icon: "🍎" },

  // Outils
  WOOD_PICKAXE: { id: 50, name: "Pioche en Bois", toolType: "pickaxe", tier: 1, speed: 2, durability: 60, maxStack: 1, icon: "⛏️" },
  STONE_PICKAXE: { id: 51, name: "Pioche en Pierre", toolType: "pickaxe", tier: 2, speed: 4, durability: 130, maxStack: 1, icon: "⛏️" },
  IRON_PICKAXE: { id: 52, name: "Pioche en Fer", toolType: "pickaxe", tier: 3, speed: 6, durability: 250, maxStack: 1, icon: "⛏️" },
  DIAMOND_PICKAXE: { id: 53, name: "Pioche en Diamant", toolType: "pickaxe", tier: 4, speed: 8, durability: 1500, maxStack: 1, icon: "⛏️" },

  WOOD_AXE: { id: 54, name: "Hache en Bois", toolType: "axe", tier: 1, speed: 2, durability: 60, maxStack: 1, icon: "🪓" },
  STONE_AXE: { id: 55, name: "Hache en Pierre", toolType: "axe", tier: 2, speed: 4, durability: 130, maxStack: 1, icon: "🪓" },
  IRON_AXE: { id: 56, name: "Hache en Fer", toolType: "axe", tier: 3, speed: 6, durability: 250, maxStack: 1, icon: "🪓" },

  WOOD_SWORD: { id: 57, name: "Épée en Bois", toolType: "sword", attackPower: 4, durability: 60, maxStack: 1, icon: "🗡️" },
  IRON_SWORD: { id: 58, name: "Épée en Fer", toolType: "sword", attackPower: 7, durability: 250, maxStack: 1, icon: "⚔️" },
  DIAMOND_SWORD: { id: 59, name: "Épée en Diamant", toolType: "sword", attackPower: 10, durability: 1500, maxStack: 1, icon: "⚔️" }
};

class Inventory {
  constructor() {
    this.slots = new Array(36).fill(null);
  }

  addItem(itemDef, count = 1, currentDurability = null) {
    let remaining = count;

    if (itemDef.maxStack > 1) {
      for (let i = 0; i < 36; i++) {
        let slot = this.slots[i];
        if (slot && slot.item.id === itemDef.id && slot.count < itemDef.maxStack) {
          let space = itemDef.maxStack - slot.count;
          let add = Math.min(space, remaining);
          slot.count += add;
          remaining -= add;
          if (remaining <= 0) break;
        }
      }
    }

    if (remaining > 0) {
      for (let i = 0; i < 36; i++) {
        if (!this.slots[i]) {
          let add = Math.min(itemDef.maxStack, remaining);
          this.slots[i] = {
            item: itemDef,
            count: add,
            durability: currentDurability !== null ? currentDurability : (itemDef.durability || null)
          };
          remaining -= add;
          if (remaining <= 0) break;
        }
      }
    }

    this.render();
    return remaining === 0;
  }

  getSelectedItem() {
    let slotIdx = 27 + UI.selectedSlot;
    return this.slots[slotIdx];
  }

  consumeSelectedItem(count = 1) {
    let slotIdx = 27 + UI.selectedSlot;
    let slot = this.slots[slotIdx];
    if (slot) {
      slot.count -= count;
      if (slot.count <= 0) {
        this.slots[slotIdx] = null;
      }
      this.render();
    }
  }

  useToolDurability() {
    let slotIdx = 27 + UI.selectedSlot;
    let slot = this.slots[slotIdx];
    if (slot && slot.durability !== null) {
      slot.durability -= 1;
      if (slot.durability <= 0) {
        this.slots[slotIdx] = null;
        if (typeof AudioEngine !== 'undefined') AudioEngine.playBreakSound();
      }
      this.render();
    }
  }

  render() {
    const hotbarSlots = document.querySelectorAll('.hotbar-slot');
    hotbarSlots.forEach((el, i) => {
      let itemSlot = this.slots[27 + i];
      this.updateSlotElement(el, itemSlot);
    });

    const mainInvSlots = document.querySelectorAll('#main-inventory-grid .inv-slot');
    mainInvSlots.forEach((el, i) => {
      let itemSlot = this.slots[i];
      this.updateSlotElement(el, itemSlot);
    });

    const invHotbarSlots = document.querySelectorAll('#inv-hotbar-grid .inv-slot');
    invHotbarSlots.forEach((el, i) => {
      let itemSlot = this.slots[27 + i];
      this.updateSlotElement(el, itemSlot);
    });
  }

  updateSlotElement(element, slotData) {
    element.innerHTML = '';
    if (!slotData) return;

    let icon = document.createElement('div');
    icon.className = 'slot-icon';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.fontSize = '20px';
    icon.textContent = slotData.item.icon || slotData.item.name.charAt(0);
    element.appendChild(icon);

    if (slotData.count > 1) {
      let countEl = document.createElement('div');
      countEl.className = 'slot-count';
      countEl.textContent = slotData.count;
      element.appendChild(countEl);
    }

    if (slotData.durability !== null && slotData.item.durability) {
      let durEl = document.createElement('div');
      durEl.className = 'slot-durability';
      let pct = (slotData.durability / slotData.item.durability) * 100;
      durEl.style.width = `${pct}%`;
      element.appendChild(durEl);
    }
  }
}

const playerInventory = new Inventory();

playerInventory.addItem(ITEMS.WOOD, 10);
playerInventory.addItem(ITEMS.WOOD_PICKAXE, 1);
