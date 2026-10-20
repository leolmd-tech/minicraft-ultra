// ui.js - Interface Utilisateur (HUD, Inventaire, Crafting, Fourneau, F3, Boussole)

const UI = {
  isInventoryOpen: false,
  isDebugOpen: false,
  selectedSlot: 0,
  heldItemSlot: null, // Slot de provenance de l'item attrapé
  heldItemData: null, // Données de l'item tenu dans le curseur de la souris

  init: function() {
    this.createHotbarDOM();
    this.createInventoryDOM();
    this.setupEventListeners();
    this.setupInventoryInteractions();
  },

  createHotbarDOM: function() {
    const hotbarContainer = document.getElementById('hotbar');
    hotbarContainer.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${i === this.selectedSlot ? 'active' : ''}`;
      slot.dataset.slotIndex = i;

      slot.addEventListener('click', () => {
        this.selectSlot(i);
      });

      hotbarContainer.appendChild(slot);
    }
  },

  createInventoryDOM: function() {
    const invGrid = document.getElementById('main-inventory-grid');
    const invHotbarGrid = document.getElementById('inv-hotbar-grid');
    invGrid.innerHTML = '';
    invHotbarGrid.innerHTML = '';

    for (let i = 0; i < 27; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.dataset.invSlot = i;
      invGrid.appendChild(slot);
    }

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.dataset.hotbarSlot = i;
      invHotbarGrid.appendChild(slot);
    }
  },

  setupInventoryInteractions: function() {
    const self = this;

    // Gestion du clic sur les slots de l'inventaire principal
    document.addEventListener('click', (e) => {
      let slotEl = e.target.closest('.inv-slot');
      if (!slotEl || !self.isInventoryOpen) return;

      if (slotEl.dataset.invSlot !== undefined) {
        let idx = parseInt(slotEl.dataset.invSlot);
        self.handleSlotClick(idx, 'inv');
      } else if (slotEl.dataset.hotbarSlot !== undefined) {
        let idx = parseInt(slotEl.dataset.hotbarSlot) + 27;
        self.handleSlotClick(idx, 'inv');
      } else if (slotEl.dataset.craftSlot !== undefined) {
        let idx = parseInt(slotEl.dataset.craftSlot);
        self.handleCraftSlotClick(idx, 2);
      } else if (slotEl.dataset.craft3Slot !== undefined) {
        let idx = parseInt(slotEl.dataset.craft3Slot);
        self.handleCraftSlotClick(idx, 3);
      } else if (slotEl.id === 'craft-result-slot' || slotEl.id === 'craft3-result-slot') {
        self.collectCraftResult(slotEl.id === 'craft3-result-slot' ? 3 : 2);
      }
    });
  },

  handleSlotClick: function(slotIndex, type) {
    if (!this.heldItemData) {
      // Attraper l'item du slot
      if (playerInventory.slots[slotIndex]) {
        this.heldItemData = playerInventory.slots[slotIndex];
        playerInventory.slots[slotIndex] = null;
      }
    } else {
      // Déposer ou échanger l'item
      let target = playerInventory.slots[slotIndex];
      if (!target) {
        playerInventory.slots[slotIndex] = this.heldItemData;
        this.heldItemData = null;
      } else if (target.item.id === this.heldItemData.item.id && target.item.maxStack > 1) {
        let space = target.item.maxStack - target.count;
        let add = Math.min(space, this.heldItemData.count);
        target.count += add;
        this.heldItemData.count -= add;
        if (this.heldItemData.count <= 0) this.heldItemData = null;
      } else {
        // Echange
        playerInventory.slots[slotIndex] = this.heldItemData;
        this.heldItemData = target;
      }
    }
    playerInventory.render();
    this.updateHeldCursor();
  },

  handleCraftSlotClick: function(slotIndex, gridDim) {
    let grid = (gridDim === 2) ? CraftingSystem.grid2x2 : CraftingSystem.grid3x3;

    if (!this.heldItemData) {
      if (grid[slotIndex]) {
        this.heldItemData = grid[slotIndex];
        grid[slotIndex] = null;
      }
    } else {
      let target = grid[slotIndex];
      if (!target) {
        grid[slotIndex] = this.heldItemData;
        this.heldItemData = null;
      } else {
        grid[slotIndex] = this.heldItemData;
        this.heldItemData = target;
      }
    }

    this.renderCraftGrid(gridDim);
    this.updateCraftResult(gridDim);
    this.updateHeldCursor();
  },

  renderCraftGrid: function(gridDim) {
    let grid = (gridDim === 2) ? CraftingSystem.grid2x2 : CraftingSystem.grid3x3;
    let selector = (gridDim === 2) ? '[data-craft-slot]' : '[data-craft3-slot]';
    let slots = document.querySelectorAll(selector);

    slots.forEach((el, i) => {
      let slotData = grid[i];
      playerInventory.updateSlotElement(el, slotData);
    });
  },

  updateCraftResult: function(gridDim) {
    let grid = (gridDim === 2) ? CraftingSystem.grid2x2 : CraftingSystem.grid3x3;
    let resultSlot = document.getElementById(gridDim === 2 ? 'craft-result-slot' : 'craft3-result-slot');

    let res = CraftingSystem.checkRecipe(grid, gridDim);
    if (res) {
      let resData = {
        item: res.item,
        count: res.count,
        durability: res.item.durability || null
      };
      playerInventory.updateSlotElement(resultSlot, resData);
      resultSlot.dataset.hasResult = "true";
    } else {
      resultSlot.innerHTML = '';
      delete resultSlot.dataset.hasResult;
    }
  },

  collectCraftResult: function(gridDim) {
    let resultSlot = document.getElementById(gridDim === 2 ? 'craft-result-slot' : 'craft3-result-slot');
    if (!resultSlot.dataset.hasResult) return;

    let grid = (gridDim === 2) ? CraftingSystem.grid2x2 : CraftingSystem.grid3x3;
    let res = CraftingSystem.checkRecipe(grid, gridDim);

    if (res) {
      playerInventory.addItem(res.item, res.count);

      // Consommer 1 de chaque élément dans la grille
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          grid[i].count -= 1;
          if (grid[i].count <= 0) grid[i] = null;
        }
      }

      this.renderCraftGrid(gridDim);
      this.updateCraftResult(gridDim);
      playerInventory.render();
      if (typeof AudioEngine !== 'undefined') AudioEngine.playPlaceSound();
    }
  },

  updateHeldCursor: function() {
    let tooltip = document.getElementById('tooltip');
    if (this.heldItemData) {
      tooltip.style.display = 'block';
      tooltip.textContent = `${this.heldItemData.item.icon || ''} ${this.heldItemData.item.name} (${this.heldItemData.count})`;
    } else {
      tooltip.style.display = 'none';
    }
  },

  setupEventListeners: function() {
    document.addEventListener('mousemove', (e) => {
      if (this.heldItemData) {
        let tooltip = document.getElementById('tooltip');
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
      }
    });

    document.getElementById('btn-play-new').addEventListener('click', () => {
      let seedVal = parseInt(document.getElementById('input-seed').value) || 12345;
      if (typeof Engine !== 'undefined') Engine.startNewGame(seedVal);
      document.getElementById('modal-main-menu').classList.add('hidden');
    });

    document.getElementById('btn-play-continue').addEventListener('click', () => {
      if (typeof SaveSystem !== 'undefined') SaveSystem.loadGame();
      document.getElementById('modal-main-menu').classList.add('hidden');
    });

    document.getElementById('btn-help').addEventListener('click', () => {
      document.getElementById('modal-help').classList.remove('hidden');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
      document.getElementById('modal-help').classList.add('hidden');
    });

    document.getElementById('btn-close-inventory').addEventListener('click', () => {
      this.toggleInventory(false);
    });

    document.getElementById('btn-respawn').addEventListener('click', () => {
      mainPlayer.reset(0, 0);
      document.getElementById('modal-death').classList.add('hidden');
    });

    window.addEventListener('wheel', (e) => {
      if (this.isInventoryOpen) return;
      if (e.deltaY > 0) {
        this.selectSlot((this.selectedSlot + 1) % 9);
      } else {
        this.selectSlot((this.selectedSlot + 8) % 9);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '9') {
        let index = parseInt(e.key) - 1;
        this.selectSlot(index);
      }
    });
  },

  selectSlot: function(index) {
    this.selectedSlot = index;
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((s, idx) => {
      if (idx === index) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  },

  toggleInventory: function(forceState) {
    if (forceState !== undefined) {
      this.isInventoryOpen = forceState;
    } else {
      this.isInventoryOpen = !this.isInventoryOpen;
    }

    const modalInv = document.getElementById('modal-inventory');
    if (this.isInventoryOpen) {
      modalInv.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      modalInv.classList.add('hidden');
    }
  },

  toggleDebug: function() {
    this.isDebugOpen = !this.isDebugOpen;
    document.getElementById('debug-overlay').style.display = this.isDebugOpen ? 'block' : 'none';
  },

  showDeathScreen: function() {
    document.getElementById('modal-death').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  },

  updateHUD: function(fps) {
    const heartsContainer = document.getElementById('hearts-container');
    heartsContainer.innerHTML = '';
    let currentHP = mainPlayer.health;

    for (let i = 0; i < 10; i++) {
      let heartSpan = document.createElement('span');
      heartSpan.className = 'heart';
      if (currentHP >= (i + 1) * 2) {
        heartSpan.innerHTML = '❤️';
      } else if (currentHP >= i * 2 + 1) {
        heartSpan.innerHTML = '💔';
      } else {
        heartSpan.innerHTML = '🖤';
      }
      heartsContainer.appendChild(heartSpan);
    }

    const hungerContainer = document.getElementById('hunger-container');
    hungerContainer.innerHTML = '';
    let currentHunger = mainPlayer.hunger;

    for (let i = 0; i < 10; i++) {
      let foodSpan = document.createElement('span');
      foodSpan.className = 'food-icon';
      if (currentHunger >= (i + 1) * 2) {
        foodSpan.innerHTML = '🍗';
      } else {
        foodSpan.innerHTML = '🦴';
      }
      hungerContainer.appendChild(foodSpan);
    }

    if (this.isDebugOpen) {
      document.getElementById('debug-fps').textContent = `FPS: ${Math.round(fps)}`;
      document.getElementById('debug-pos').textContent = `XYZ: ${mainPlayer.position.x.toFixed(1)} / ${mainPlayer.position.y.toFixed(1)} / ${mainPlayer.position.z.toFixed(1)}`;

      let cx = Math.floor(mainPlayer.position.x / CHUNK_SIZE_X);
      let cz = Math.floor(mainPlayer.position.z / CHUNK_SIZE_Z);
      document.getElementById('debug-chunk').textContent = `Chunk: ${cx}, ${cz}`;

      let currentBiome = WorldGen.getBiome(Math.floor(mainPlayer.position.x), Math.floor(mainPlayer.position.z));
      document.getElementById('debug-biome').textContent = `Biome: ${currentBiome.name}`;
      document.getElementById('debug-seed').textContent = `Seed: ${WorldGen.currentSeed}`;
    }

    const needle = document.getElementById('compass-needle');
    if (needle) {
      let dx = 0 - mainPlayer.position.x;
      let dz = 0 - mainPlayer.position.z;
      let angleToSpawn = Math.atan2(dx, dz);
      let needleAngle = angleToSpawn - mainPlayer.yaw;
      needle.style.transform = `rotate(${needleAngle}rad)`;
    }
  }
};

UI.init();
