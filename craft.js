// craft.js - Moteur de Crafting (2x2 et 3x3) & Fourneau

const RECIPES = [
  // 1. Bois -> 4 Planches
  {
    grid: [
      [ITEMS.WOOD]
    ],
    result: { item: ITEMS.PLANKS, count: 4 }
  },
  // 2. 2 Planches (vertical) -> 4 Bâtons
  {
    grid: [
      [ITEMS.PLANKS],
      [ITEMS.PLANKS]
    ],
    result: { item: ITEMS.STICK, count: 4 }
  },
  // 3. 4 Planches (2x2) -> Table de Craft
  {
    grid: [
      [ITEMS.PLANKS, ITEMS.PLANKS],
      [ITEMS.PLANKS, ITEMS.PLANKS]
    ],
    result: { item: ITEMS.WORKBENCH, count: 1 }
  },
  // 4. 8 Pierres -> Fourneau
  {
    grid: [
      [ITEMS.STONE, ITEMS.STONE, ITEMS.STONE],
      [ITEMS.STONE, null,        ITEMS.STONE],
      [ITEMS.STONE, ITEMS.STONE, ITEMS.STONE]
    ],
    result: { item: ITEMS.FURNACE, count: 1 }
  },
  // 5. Pioche en Bois
  {
    grid: [
      [ITEMS.PLANKS, ITEMS.PLANKS, ITEMS.PLANKS],
      [null,         ITEMS.STICK,  null],
      [null,         ITEMS.STICK,  null]
    ],
    result: { item: ITEMS.WOOD_PICKAXE, count: 1 }
  },
  // 6. Pioche en Pierre
  {
    grid: [
      [ITEMS.STONE, ITEMS.STONE, ITEMS.STONE],
      [null,        ITEMS.STICK, null],
      [null,        ITEMS.STICK, null]
    ],
    result: { item: ITEMS.STONE_PICKAXE, count: 1 }
  },
  // 7. Épée en Bois
  {
    grid: [
      [ITEMS.PLANKS],
      [ITEMS.PLANKS],
      [ITEMS.STICK]
    ],
    result: { item: ITEMS.WOOD_SWORD, count: 1 }
  },
  // 8. Épée en Fer
  {
    grid: [
      [ITEMS.IRON_INGOT],
      [ITEMS.IRON_INGOT],
      [ITEMS.STICK]
    ],
    result: { item: ITEMS.IRON_SWORD, count: 1 }
  }
];

// Recettes du Four
const SMELTING_RECIPES = [
  { input: ITEMS.ORE_IRON, output: ITEMS.IRON_INGOT, time: 5 },
  { input: ITEMS.ORE_GOLD, output: ITEMS.GOLD_INGOT, time: 5 },
  { input: ITEMS.SAND, output: ITEMS.GLASS, time: 3 },
  { input: ITEMS.RAW_MEAT, output: ITEMS.COOKED_MEAT, time: 4 }
];

const CraftingSystem = {
  grid2x2: new Array(4).fill(null),
  grid3x3: new Array(9).fill(null),

  checkRecipe: function(grid, size) {
    for (let recipe of RECIPES) {
      if (this.matchGrid(grid, size, recipe.grid)) {
        return recipe.result;
      }
    }
    return null;
  },

  matchGrid: function(grid, size, recipeGrid) {
    let rRows = recipeGrid.length;
    let rCols = recipeGrid[0].length;

    for (let r = 0; r <= size - rRows; r++) {
      for (let c = 0; c <= size - rCols; c++) {
        let match = true;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            let itemInSlot = grid[y * size + x] ? grid[y * size + x].item : null;
            let rx = x - c;
            let ry = y - r;

            if (rx >= 0 && rx < rCols && ry >= 0 && ry < rRows) {
              let expected = recipeGrid[ry][rx];
              if (expected === null) {
                if (itemInSlot !== null) match = false;
              } else {
                if (!itemInSlot || itemInSlot.id !== expected.id) match = false;
              }
            } else {
              if (itemInSlot !== null) match = false;
            }
          }
        }
        if (match) return true;
      }
    }
    return false;
  }
};
