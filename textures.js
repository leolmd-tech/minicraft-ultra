// textures.js - Generateur de textures pixel-art 16x16 procedurales en Canvas

const Textures = {
  materials: {},
  canvasCache: {},
  textureAtlas: null,

  // Helper de bruit pseudo-aleatoire deterministe
  pseudoRandom: function(x, y, seed = 0) {
    let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  },

  // Generer une texture 16x16 en HTML Canvas
  createCanvas16: function(drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    drawFn(ctx);
    return canvas;
  },

  // Conversion Canvas -> THREE.CanvasTexture avec param. nearest neighbor
  createTextureFromCanvas: function(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  },

  init: function() {
    // 1. DIRT (Terre)
    const canvasDirt = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 1);
          let r = Math.floor(110 + noise * 30);
          let g = Math.floor(75 + noise * 25);
          let b = Math.floor(45 + noise * 20);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 2. GRASS TOP (Herbe haut)
    const canvasGrassTop = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 2);
          let r = Math.floor(65 + noise * 35);
          let g = Math.floor(155 + noise * 50);
          let b = Math.floor(45 + noise * 25);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 3. GRASS SIDE (Herbe cote)
    const canvasGrassSide = this.createCanvas16((ctx) => {
      // Background dirt
      ctx.drawImage(canvasDirt, 0, 0);
      // Top grass layer
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let depth = Math.floor(3 + this.pseudoRandom(x, 0, 3) * 3);
          if (y < depth) {
            let noise = this.pseudoRandom(x, y, 2);
            let r = Math.floor(65 + noise * 35);
            let g = Math.floor(155 + noise * 50);
            let b = Math.floor(45 + noise * 25);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 4. STONE (Pierre)
    const canvasStone = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 4);
          let val = Math.floor(110 + noise * 50);
          ctx.fillStyle = `rgb(${val},${val},${val})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 5. SAND (Sable)
    const canvasSand = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 5);
          let r = Math.floor(215 + noise * 30);
          let g = Math.floor(200 + noise * 35);
          let b = Math.floor(140 + noise * 30);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 6. WOOD SIDE (Bois ecorce)
    const canvasWoodSide = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 6);
          let barkLine = (x % 4 === 0) ? -20 : 0;
          let r = Math.floor(105 + noise * 25 + barkLine);
          let g = Math.floor(75 + noise * 20 + barkLine);
          let b = Math.floor(40 + noise * 15 + barkLine);
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 7. WOOD TOP (Tronc coupe)
    const canvasWoodTop = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let dx = x - 7.5;
          let dy = y - 7.5;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let ring = Math.floor(dist) % 2 === 0 ? 15 : -15;
          let noise = this.pseudoRandom(x, y, 7);
          let r = Math.floor(160 + ring + noise * 20);
          let g = Math.floor(125 + ring + noise * 15);
          let b = Math.floor(80 + ring + noise * 10);
          if (dist > 6.5) {
            // Ecorce exterieure
            r = 90; g = 60; b = 30;
          }
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 8. LEAVES (Feuilles)
    const canvasLeaves = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 8);
          if (noise < 0.2) {
            // Trou / sombre
            ctx.fillStyle = `rgb(20,60,15)`;
          } else {
            let r = Math.floor(40 + noise * 30);
            let g = Math.floor(120 + noise * 70);
            let b = Math.floor(25 + noise * 20);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 9. PLANKS (Planches)
    const canvasPlanks = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let plankLine = (y % 4 === 0) ? -35 : 0;
          let nail = ((y % 4 === 1) && (x === 1 || x === 14)) ? -50 : 0;
          let noise = this.pseudoRandom(x, y, 9);
          let r = Math.floor(175 + noise * 25 + plankLine + nail);
          let g = Math.floor(135 + noise * 20 + plankLine + nail);
          let b = Math.floor(85 + noise * 15 + plankLine + nail);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 10. GLASS (Verre)
    const canvasGlass = this.createCanvas16((ctx) => {
      ctx.fillStyle = 'rgba(200, 230, 255, 0.25)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      // Cadre & reflexions
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(3, 3, 3, 1);
      ctx.fillRect(4, 4, 3, 1);
    });

    // 11. BRICKS (Briques)
    const canvasBricks = this.createCanvas16((ctx) => {
      ctx.fillStyle = '#b0b0b0'; // Mortier
      ctx.fillRect(0, 0, 16, 16);
      for (let row = 0; row < 4; row++) {
        let yOffset = row * 4 + 1;
        let xShift = (row % 2 === 0) ? 0 : 4;
        for (let col = -1; col < 3; col++) {
          let xOffset = col * 8 + xShift;
          for (let py = 0; py < 3; py++) {
            for (let px = 0; px < 7; px++) {
              let bx = xOffset + px;
              let by = yOffset + py;
              if (bx >= 0 && bx < 16 && by >= 0 && by < 16) {
                let noise = this.pseudoRandom(bx, by, 11);
                let r = Math.floor(160 + noise * 40);
                let g = Math.floor(60 + noise * 20);
                let b = Math.floor(50 + noise * 20);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(bx, by, 1, 1);
              }
            }
          }
        }
      }
    });

    // Helper pour minerais
    const createOreCanvas = (oreR, oreG, oreB, seed) => {
      return this.createCanvas16((ctx) => {
        ctx.drawImage(canvasStone, 0, 0);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            let n = this.pseudoRandom(x, y, seed);
            if (n > 0.72) {
              let noise = this.pseudoRandom(x, y, seed + 1);
              let r = Math.floor(oreR + noise * 30);
              let g = Math.floor(oreG + noise * 30);
              let b = Math.floor(oreB + noise * 30);
              ctx.fillStyle = `rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      });
    };

    // 12-15 MINERAIS
    const canvasOreCoal = createOreCanvas(30, 30, 30, 12);
    const canvasOreIron = createOreCanvas(190, 140, 110, 13);
    const canvasOreGold = createOreCanvas(240, 200, 30, 14);
    const canvasOreDiamond = createOreCanvas(70, 230, 240, 15);

    // 16. BEDROCK (Roche mere)
    const canvasBedrock = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 16);
          let val = Math.floor(30 + noise * 40);
          ctx.fillStyle = `rgb(${val},${val},${val})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 17. SNOW (Neige)
    const canvasSnow = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 17);
          let r = Math.floor(235 + noise * 20);
          let g = Math.floor(240 + noise * 15);
          let b = Math.floor(250 + noise * 5);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 18. CACTUS SIDE
    const canvasCactusSide = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let stripe = (x === 2 || x === 7 || x === 12) ? -30 : 0;
          let prickle = (x % 4 === 1 && y % 4 === 1) ? 60 : 0;
          let noise = this.pseudoRandom(x, y, 18);
          let r = Math.floor(20 + noise * 20 + prickle);
          let g = Math.floor(130 + noise * 40 + stripe + prickle);
          let b = Math.floor(20 + noise * 20 + prickle);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 19. WORKBENCH TOP (Table de craft)
    const canvasWorkbenchTop = this.createCanvas16((ctx) => {
      ctx.drawImage(canvasPlanks, 0, 0);
      ctx.fillStyle = 'rgba(80, 40, 10, 0.6)';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(9, 9, 3, 3);
    });

    // 20. FURNACE FRONT (Four devant)
    const canvasFurnaceFront = this.createCanvas16((ctx) => {
      ctx.drawImage(canvasStone, 0, 0);
      ctx.fillStyle = '#111';
      ctx.fillRect(3, 4, 10, 8);
      // Glow/flame
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(5, 8, 6, 3);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(6, 9, 4, 2);
    });

    // 21. WATER (Eau)
    const canvasWater = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 21);
          let r = Math.floor(30 + noise * 20);
          let g = Math.floor(80 + noise * 30);
          let b = Math.floor(210 + noise * 45);
          ctx.fillStyle = `rgba(${r},${g},${b}, 0.75)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 22. LAVA (Lave)
    const canvasLava = this.createCanvas16((ctx) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let noise = this.pseudoRandom(x, y, 22);
          let r = Math.floor(230 + noise * 25);
          let g = Math.floor(60 + noise * 80);
          let b = 10;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // Stocker les canvas dans la cache
    this.canvasCache = {
      dirt: canvasDirt,
      grassTop: canvasGrassTop,
      grassSide: canvasGrassSide,
      stone: canvasStone,
      sand: canvasSand,
      woodSide: canvasWoodSide,
      woodTop: canvasWoodTop,
      leaves: canvasLeaves,
      planks: canvasPlanks,
      glass: canvasGlass,
      bricks: canvasBricks,
      oreCoal: canvasOreCoal,
      oreIron: canvasOreIron,
      oreGold: canvasOreGold,
      oreDiamond: canvasOreDiamond,
      bedrock: canvasBedrock,
      snow: canvasSnow,
      cactusSide: canvasCactusSide,
      workbenchTop: canvasWorkbenchTop,
      furnaceFront: canvasFurnaceFront,
      water: canvasWater,
      lava: canvasLava
    };

    // Generer le Texture Atlas (Grille de toutes les textures pour les chunks Instanced/Buffer)
    this.createTextureAtlas();
  },

  // Indexation des textures dans l'Atlas
  // 0: Dirt, 1: GrassTop, 2: GrassSide, 3: Stone, 4: Sand, 5: WoodSide, 6: WoodTop, 7: Leaves,
  // 8: Planks, 9: Glass, 10: Bricks, 11: OreCoal, 12: OreIron, 13: OreGold, 14: OreDiamond, 15: Bedrock,
  // 16: Snow, 17: CactusSide, 18: WorkbenchTop, 19: FurnaceFront, 20: Water, 21: Lava
  TEXTURE_MAP: {
    DIRT: 0,
    GRASS_TOP: 1,
    GRASS_SIDE: 2,
    STONE: 3,
    SAND: 4,
    WOOD_SIDE: 5,
    WOOD_TOP: 6,
    LEAVES: 7,
    PLANKS: 8,
    GLASS: 9,
    BRICKS: 10,
    ORE_COAL: 11,
    ORE_IRON: 12,
    ORE_GOLD: 13,
    ORE_DIAMOND: 14,
    BEDROCK: 15,
    SNOW: 16,
    CACTUS_SIDE: 17,
    WORKBENCH_TOP: 18,
    FURNACE_FRONT: 19,
    WATER: 20,
    LAVA: 21
  },

  createTextureAtlas: function() {
    const atlasCanvas = document.createElement('canvas');
    // Atlas de 16x16 sub-textures => Canvas final 256x256 (16 x 16 pixels * 16 cols/rows)
    atlasCanvas.width = 256;
    atlasCanvas.height = 256;
    const ctx = atlasCanvas.getContext('2d');

    const order = [
      this.canvasCache.dirt,          // 0
      this.canvasCache.grassTop,      // 1
      this.canvasCache.grassSide,     // 2
      this.canvasCache.stone,         // 3
      this.canvasCache.sand,          // 4
      this.canvasCache.woodSide,      // 5
      this.canvasCache.woodTop,       // 6
      this.canvasCache.leaves,        // 7
      this.canvasCache.planks,        // 8
      this.canvasCache.glass,         // 9
      this.canvasCache.bricks,        // 10
      this.canvasCache.oreCoal,       // 11
      this.canvasCache.oreIron,       // 12
      this.canvasCache.oreGold,       // 13
      this.canvasCache.oreDiamond,    // 14
      this.canvasCache.bedrock,       // 15
      this.canvasCache.snow,          // 16
      this.canvasCache.cactusSide,    // 17
      this.canvasCache.workbenchTop,  // 18
      this.canvasCache.furnaceFront,  // 19
      this.canvasCache.water,         // 20
      this.canvasCache.lava           // 21
    ];

    order.forEach((canvas, idx) => {
      let col = idx % 16;
      let row = Math.floor(idx / 16);
      ctx.drawImage(canvas, col * 16, row * 16);
    });

    this.textureAtlas = this.createTextureFromCanvas(atlasCanvas);
  },

  // Helper pour recuperer les UVs dans l'atlas pour un ID de texture
  getUVs: function(textureIdx) {
    let col = textureIdx % 16;
    let row = Math.floor(textureIdx / 16);
    let uMin = col / 16;
    let uMax = (col + 1) / 16;
    let vMin = 1.0 - (row + 1) / 16;
    let vMax = 1.0 - row / 16;
    return { uMin, uMax, vMin, vMax };
  }
};

// Initialiser les textures des le chargement du script
Textures.init();
