// moteur.js - Moteur de rendu principal, minage progressif & boucle de jeu

const Engine = {
  scene: null,
  camera: null,
  renderer: null,
  sunLight: null,
  ambientLight: null,

  clock: new THREE.Clock(),
  lastFrameTime: performance.now(),
  frameCount: 0,
  currentFPS: 60,

  worldTime: 0,
  dayLength: 900,

  raycaster: new THREE.Raycaster(),
  mouseVector: new THREE.Vector2(0, 0),

  // Variables de minage progressif
  isMining: false,
  miningBlockPos: null,
  miningProgress: 0,
  miningTargetTime: 1.0,

  init: function() {
    const canvas = document.getElementById('webgl-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(100, 150, 50);
    this.scene.add(this.sunLight);

    ChunkManager.init(this.scene);
    Controls.init(canvas, this.camera);
    this.setupInteractions(canvas);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setInterval(() => {
      if (!mainPlayer.isDead) SaveSystem.saveGame();
    }, 30000);

    document.getElementById('loading-screen').style.display = 'none';

    this.animate();
  },

  startNewGame: function(seed) {
    WorldGen.setSeed(seed);
    mainPlayer.reset(0, 0);
    ChunkManager.updateAroundPlayer(mainPlayer.position.x, mainPlayer.position.z);

    MobManager.spawnMob('pig', 5, 30, 5, this.scene);
    MobManager.spawnMob('cow', -5, 30, -5, this.scene);
    MobManager.spawnMob('zombie', 10, 30, 10, this.scene);
  },

  setupInteractions: function(canvas) {
    window.addEventListener('mousedown', (e) => {
      if (!Controls.isPointerLocked && !Controls.isMobile) return;
      if (UI.isInventoryOpen || mainPlayer.isDead) return;

      if (e.button === 0) {
        this.startMining();
      } else if (e.button === 2) {
        this.handleRightClick();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.stopMining();
      }
    });

    document.getElementById('btn-mobile-break').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startMining();
    });
    document.getElementById('btn-mobile-break').addEventListener('touchend', (e) => {
      this.stopMining();
    });

    document.getElementById('btn-mobile-place').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleRightClick();
    });
  },

  startMining: function() {
    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    let intersect = this.getRaycastBlock();

    if (intersect) {
      let bx = intersect.blockPos.x;
      let by = intersect.blockPos.y;
      let bz = intersect.blockPos.z;

      let blockType = ChunkManager.getBlockGlobal(bx, by, bz);
      if (blockType !== BLOCKS.AIR && blockType !== BLOCKS.BEDROCK) {
        this.isMining = true;
        this.miningBlockPos = intersect.blockPos;
        this.miningProgress = 0;

        // Calculer la vitesse de minage
        let itemSlot = playerInventory.getSelectedItem();
        let speedMult = 1.0;
        if (itemSlot && itemSlot.item.speed) {
          speedMult = itemSlot.item.speed;
        }

        this.miningTargetTime = Math.max(0.2, 1.5 / speedMult);
        document.getElementById('mining-progress-container').style.display = 'block';
      }
    }
  },

  stopMining: function() {
    this.isMining = false;
    this.miningBlockPos = null;
    this.miningProgress = 0;
    document.getElementById('mining-progress-container').style.display = 'none';
  },

  updateMining: function(delta) {
    if (!this.isMining || !this.miningBlockPos) return;

    this.miningProgress += delta;
    let pct = Math.min(100, (this.miningProgress / this.miningTargetTime) * 100);
    document.getElementById('mining-progress-bar').style.width = `${pct}%`;

    if (this.miningProgress >= this.miningTargetTime) {
      let bx = this.miningBlockPos.x;
      let by = this.miningBlockPos.y;
      let bz = this.miningBlockPos.z;

      let blockType = ChunkManager.getBlockGlobal(bx, by, bz);
      if (blockType !== BLOCKS.AIR && blockType !== BLOCKS.BEDROCK) {
        ChunkManager.setBlockGlobal(bx, by, bz, BLOCKS.AIR);
        if (typeof AudioEngine !== 'undefined') AudioEngine.playBreakSound();

        // Réduire durabilité de l'outil
        playerInventory.useToolDurability();

        // Drops
        if (blockType === BLOCKS.STONE) playerInventory.addItem(ITEMS.STONE, 1);
        else if (blockType === BLOCKS.DIRT || blockType === BLOCKS.GRASS) playerInventory.addItem(ITEMS.DIRT, 1);
        else if (blockType === BLOCKS.WOOD) playerInventory.addItem(ITEMS.WOOD, 1);
        else if (blockType === BLOCKS.LEAVES) playerInventory.addItem(ITEMS.LEAVES, 1);
        else if (blockType === BLOCKS.SAND) playerInventory.addItem(ITEMS.SAND, 1);
        else if (blockType === BLOCKS.ORE_COAL) playerInventory.addItem(ITEMS.COAL, 1);
        else if (blockType === BLOCKS.ORE_IRON) playerInventory.addItem(ITEMS.ORE_IRON, 1);
        else if (blockType === BLOCKS.WORKBENCH) playerInventory.addItem(ITEMS.WORKBENCH, 1);
        else if (blockType === BLOCKS.FURNACE) playerInventory.addItem(ITEMS.FURNACE, 1);
      }

      this.stopMining();
    }
  },

  handleRightClick: function() {
    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    let intersect = this.getRaycastBlock();

    if (intersect) {
      let bx = intersect.blockPos.x;
      let by = intersect.blockPos.y;
      let bz = intersect.blockPos.z;

      let targetBlock = ChunkManager.getBlockGlobal(bx, by, bz);

      if (targetBlock === BLOCKS.WORKBENCH) {
        document.getElementById('crafting-area-3x3').classList.remove('hidden');
        document.getElementById('crafting-area-2x2').classList.add('hidden');
        UI.toggleInventory(true);
        return;
      }

      let held = playerInventory.getSelectedItem();
      if (held && held.item.isBlock) {
        let px = bx + intersect.normal.x;
        let py = by + intersect.normal.y;
        let pz = bz + intersect.normal.z;

        let pBox = Physics.getPlayerAABB(mainPlayer.position);
        if (px >= Math.floor(pBox.minX) && px <= Math.floor(pBox.maxX) &&
            py >= Math.floor(pBox.minY) && py <= Math.floor(pBox.maxY) &&
            pz >= Math.floor(pBox.minZ) && pz <= Math.floor(pBox.maxZ)) {
          return;
        }

        ChunkManager.setBlockGlobal(px, py, pz, held.item.blockId);
        playerInventory.consumeSelectedItem(1);
        if (typeof AudioEngine !== 'undefined') AudioEngine.playPlaceSound();
      }
    }
  },

  getRaycastBlock: function() {
    let meshes = [];
    for (let chunk of ChunkManager.chunks.values()) {
      if (chunk.mesh) meshes.push(chunk.mesh);
    }
    let intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0 && intersects[0].distance < 6.0) {
      let hit = intersects[0];
      let point = hit.point.clone().sub(hit.face.normal.clone().multiplyScalar(0.01));
      let bx = Math.floor(point.x);
      let by = Math.floor(point.y);
      let bz = Math.floor(point.z);
      return {
        blockPos: new THREE.Vector3(bx, by, bz),
        normal: hit.face.normal
      };
    }
    return null;
  },

  animate: function() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.frameCount++;
    let now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.currentFPS = (this.frameCount * 1000) / (now - this.lastFrameTime);
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    this.worldTime = (this.worldTime + delta) % this.dayLength;
    let timeRatio = this.worldTime / this.dayLength;
    let sunAngle = timeRatio * Math.PI * 2;

    this.sunLight.position.x = Math.cos(sunAngle) * 200;
    this.sunLight.position.y = Math.sin(sunAngle) * 200;

    if (Math.sin(sunAngle) > 0.1) {
      this.scene.background.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0x87ceeb);
      this.ambientLight.intensity = 0.6;
    } else if (Math.sin(sunAngle) < -0.1) {
      this.scene.background.setHex(0x050515);
      this.scene.fog.color.setHex(0x050515);
      this.ambientLight.intensity = 0.15;
    } else {
      this.scene.background.setHex(0xcc6633);
      this.scene.fog.color.setHex(0xcc6633);
      this.ambientLight.intensity = 0.35;
    }

    Controls.updatePlayerMovement(delta);
    MobManager.update(delta, mainPlayer, this.scene);
    this.updateMining(delta);

    ChunkManager.updateAroundPlayer(mainPlayer.position.x, mainPlayer.position.z);
    mainPlayer.updateSurvivalStats(delta);
    UI.updateHUD(this.currentFPS);

    this.renderer.render(this.scene, this.camera);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  Engine.init();
});
