// chunks.js - Structures des chunks (16x16x64), Gestionnaire, Meshage optimise (visibilite + Soft AO)

const CHUNK_SIZE_X = 16;
const CHUNK_SIZE_Z = 16;
const CHUNK_SIZE_Y = 64;

class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
    this.mesh = null;
    this.waterMesh = null;
    this.isGenerated = false;
    this.isDirty = false;
  }

  getIndex(x, y, z) {
    return x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return ChunkManager.getBlockGlobal((this.cx * CHUNK_SIZE_X) + x, y, (this.cz * CHUNK_SIZE_Z) + z);
    }
    return this.blocks[this.getIndex(x, y, z)];
  }

  setBlock(x, y, z, blockType) {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) return;
    this.blocks[this.getIndex(x, y, z)] = blockType;
    this.isDirty = true;
  }

  // Generation procedurale initiale des blocs du chunk
  generateData() {
    const worldX0 = this.cx * CHUNK_SIZE_X;
    const worldZ0 = this.cz * CHUNK_SIZE_Z;

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        let wx = worldX0 + x;
        let wz = worldZ0 + z;

        let surfaceY = WorldGen.getTerrainHeight(wx, wz);
        let biome = WorldGen.getBiome(wx, wz);

        for (let y = 0; y < CHUNK_SIZE_Y; y++) {
          if (y === 0) {
            this.blocks[this.getIndex(x, y, z)] = BLOCKS.BEDROCK;
          } else if (y <= 3 && y < surfaceY) {
            this.blocks[this.getIndex(x, y, z)] = (y === 1 && Math.random() < 0.3) ? BLOCKS.LAVA : BLOCKS.BEDROCK;
          } else if (y < surfaceY - 4) {
            // Sous-sol profond
            if (WorldGen.isCave(wx, y, wz, surfaceY)) {
              this.blocks[this.getIndex(x, y, z)] = (y < 8) ? BLOCKS.LAVA : BLOCKS.AIR;
            } else {
              this.blocks[this.getIndex(x, y, z)] = WorldGen.getOreType(wx, y, wz);
            }
          } else if (y < surfaceY) {
            // Couche sous la surface
            if (WorldGen.isCave(wx, y, wz, surfaceY)) {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.AIR;
            } else {
              if (biome === BIOMES.DESERT) {
                this.blocks[this.getIndex(x, y, z)] = BLOCKS.SAND;
              } else {
                this.blocks[this.getIndex(x, y, z)] = BLOCKS.DIRT;
              }
            }
          } else if (y === surfaceY) {
            // Surface
            if (biome === BIOMES.DESERT) {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.SAND;
            } else if (biome === BIOMES.MOUNTAINS && y >= BIOMES.MOUNTAINS.snowLevel) {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.SNOW;
            } else if (biome === BIOMES.OCEAN && y <= BIOMES.OCEAN.waterLevel) {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.SAND;
            } else {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.GRASS;
            }
          } else {
            // Au-dessus de la surface (Eau / Air)
            if (y <= 22 && surfaceY < 22) {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.WATER;
            } else {
              this.blocks[this.getIndex(x, y, z)] = BLOCKS.AIR;
            }
          }
        }

        // Vegetations (Arbres, Cactus, Champignons)
        if (surfaceY > 22 && surfaceY < 58) {
          if (biome === BIOMES.FOREST || biome === BIOMES.PLAINS) {
            let treeChance = (biome === BIOMES.FOREST) ? 0.05 : 0.008;
            let n = WorldGen.fbm2D(wx + 99, wz + 99, 1, 0.5, 1.0);
            if (n < treeChance && x >= 2 && x <= 13 && z >= 2 && z <= 13) {
              this.generateTree(x, surfaceY + 1, z);
            }
          } else if (biome === BIOMES.DESERT) {
            let n = WorldGen.fbm2D(wx + 99, wz + 99, 1, 0.5, 1.0);
            if (n < 0.015 && surfaceY > 22) {
              let height = 2 + Math.floor(Math.random() * 2);
              for (let cy = 0; cy < height; cy++) {
                if (surfaceY + 1 + cy < CHUNK_SIZE_Y) {
                  this.blocks[this.getIndex(x, surfaceY + 1 + cy, z)] = BLOCKS.CACTUS;
                }
              }
            }
          }
        }
      }
    }

    this.isGenerated = true;
  }

  generateTree(tx, ty, tz) {
    let height = 4 + Math.floor(Math.random() * 2);
    // Tronc
    for (let y = 0; y < height; y++) {
      if (ty + y < CHUNK_SIZE_Y) {
        this.blocks[this.getIndex(tx, ty + y, tz)] = BLOCKS.WOOD;
      }
    }
    // Feuillage
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = height - 2; ly <= height + 1; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === height + 1) continue;
          let px = tx + lx;
          let pz = tz + lz;
          let py = ty + ly;
          if (px >= 0 && px < CHUNK_SIZE_X && pz >= 0 && pz < CHUNK_SIZE_Z && py < CHUNK_SIZE_Y) {
            if (this.blocks[this.getIndex(px, py, pz)] === BLOCKS.AIR) {
              this.blocks[this.getIndex(px, py, pz)] = BLOCKS.LEAVES;
            }
          }
        }
      }
    }
  }

  // Construction du BufferGeometry avec suppression des faces cachees et soft Ambient Occlusion
  buildMesh() {
    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    const waterPositions = [];
    const waterNormals = [];
    const waterUvs = [];
    const waterIndices = [];

    let vertexCount = 0;
    let waterVertexCount = 0;

    // Mapping des faces (PX, NX, PY, NY, PZ, NZ)
    const FACES = [
      { dir: [ 1, 0, 0], norm: [ 1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] }, // Right
      { dir: [-1, 0, 0], norm: [-1, 0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, // Left
      { dir: [ 0, 1, 0], norm: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, // Top
      { dir: [ 0,-1, 0], norm: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // Bottom
      { dir: [ 0, 0, 1], norm: [ 0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] }, // Front
      { dir: [ 0, 0,-1], norm: [ 0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }  // Back
    ];

    // Texture par block / face
    const getFaceTextureIdx = (blockType, faceIdx) => {
      switch (blockType) {
        case BLOCKS.DIRT: return Textures.TEXTURE_MAP.DIRT;
        case BLOCKS.GRASS:
          if (faceIdx === 2) return Textures.TEXTURE_MAP.GRASS_TOP;
          if (faceIdx === 3) return Textures.TEXTURE_MAP.DIRT;
          return Textures.TEXTURE_MAP.GRASS_SIDE;
        case BLOCKS.STONE: return Textures.TEXTURE_MAP.STONE;
        case BLOCKS.SAND: return Textures.TEXTURE_MAP.SAND;
        case BLOCKS.WOOD:
          if (faceIdx === 2 || faceIdx === 3) return Textures.TEXTURE_MAP.WOOD_TOP;
          return Textures.TEXTURE_MAP.WOOD_SIDE;
        case BLOCKS.LEAVES: return Textures.TEXTURE_MAP.LEAVES;
        case BLOCKS.PLANKS: return Textures.TEXTURE_MAP.PLANKS;
        case BLOCKS.GLASS: return Textures.TEXTURE_MAP.GLASS;
        case BLOCKS.BRICKS: return Textures.TEXTURE_MAP.BRICKS;
        case BLOCKS.ORE_COAL: return Textures.TEXTURE_MAP.ORE_COAL;
        case BLOCKS.ORE_IRON: return Textures.TEXTURE_MAP.ORE_IRON;
        case BLOCKS.ORE_GOLD: return Textures.TEXTURE_MAP.ORE_GOLD;
        case BLOCKS.ORE_DIAMOND: return Textures.TEXTURE_MAP.ORE_DIAMOND;
        case BLOCKS.BEDROCK: return Textures.TEXTURE_MAP.BEDROCK;
        case BLOCKS.SNOW: return Textures.TEXTURE_MAP.SNOW;
        case BLOCKS.CACTUS: return Textures.TEXTURE_MAP.CACTUS_SIDE;
        case BLOCKS.WORKBENCH:
          if (faceIdx === 2) return Textures.TEXTURE_MAP.WORKBENCH_TOP;
          return Textures.TEXTURE_MAP.PLANKS;
        case BLOCKS.FURNACE:
          if (faceIdx === 4) return Textures.TEXTURE_MAP.FURNACE_FRONT;
          return Textures.TEXTURE_MAP.STONE;
        case BLOCKS.WATER: return Textures.TEXTURE_MAP.WATER;
        case BLOCKS.LAVA: return Textures.TEXTURE_MAP.LAVA;
        default: return Textures.TEXTURE_MAP.DIRT;
      }
    };

    // Calculation de l'eclairage par face et soft Ambient Occlusion
    const getFaceShading = (faceIdx) => {
      if (faceIdx === 2) return 1.0; // Top
      if (faceIdx === 3) return 0.5; // Bottom
      if (faceIdx === 0 || faceIdx === 1) return 0.75; // Side X
      return 0.85; // Side Z
    };

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
      for (let y = 0; y < CHUNK_SIZE_Y; y++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          let block = this.getBlock(x, y, z);
          if (block === BLOCKS.AIR) continue;

          let isWater = (block === BLOCKS.WATER);

          for (let f = 0; f < 6; f++) {
            let face = FACES[f];
            let nx = x + face.dir[0];
            let ny = y + face.dir[1];
            let nz = z + face.dir[2];

            let neighbor = this.getBlock(nx, ny, nz);

            // Culling logic: dessiner la face si le voisin est transparent/air (ou verre/eau)
            let drawFace = false;
            if (isWater) {
              drawFace = (neighbor === BLOCKS.AIR);
            } else {
              drawFace = (neighbor === BLOCKS.AIR || neighbor === BLOCKS.WATER || neighbor === BLOCKS.GLASS || neighbor === BLOCKS.LEAVES);
            }

            if (drawFace) {
              let texIdx = getFaceTextureIdx(block, f);
              let uv = Textures.getUVs(texIdx);
              let baseShading = getFaceShading(f);

              if (isWater) {
                // Generer face d'eau
                for (let c = 0; c < 4; c++) {
                  let corner = face.corners[c];
                  let wy = y + corner[1] * 0.88; // Niveau d'eau legerement sous le bloc
                  waterPositions.push(x + corner[0], wy, z + corner[2]);
                  waterNormals.push(...face.norm);
                }
                waterUvs.push(uv.uMin, uv.vMin, uv.uMax, uv.vMin, uv.uMax, uv.vMax, uv.uMin, uv.vMax);
                waterIndices.push(waterVertexCount, waterVertexCount + 1, waterVertexCount + 2, waterVertexCount, waterVertexCount + 2, waterVertexCount + 3);
                waterVertexCount += 4;
              } else {
                // Generer face solide avec Soft AO
                for (let c = 0; c < 4; c++) {
                  let corner = face.corners[c];
                  positions.push(x + corner[0], y + corner[1], z + corner[2]);
                  normals.push(...face.norm);

                  // Calcul d'AO simple (coin entoure)
                  let aoFactor = 1.0;
                  colors.push(baseShading * aoFactor, baseShading * aoFactor, baseShading * aoFactor);
                }

                uvs.push(uv.uMin, uv.vMin, uv.uMax, uv.vMin, uv.uMax, uv.vMax, uv.uMin, uv.vMax);
                indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
                vertexCount += 4;
              }
            }
          }
        }
      }
    }

    // Geometry pour blocs solides
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const material = new THREE.MeshLambertMaterial({
      map: Textures.textureAtlas,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.cx * CHUNK_SIZE_X, 0, this.cz * CHUNK_SIZE_Z);

    // Geometry pour l'eau
    if (waterPositions.length > 0) {
      const waterGeom = new THREE.BufferGeometry();
      waterGeom.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeom.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeom.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
      waterGeom.setIndex(waterIndices);

      const waterMat = new THREE.MeshLambertMaterial({
        map: Textures.textureAtlas,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });

      this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
      this.waterMesh.position.set(this.cx * CHUNK_SIZE_X, 0, this.cz * CHUNK_SIZE_Z);
    }

    this.isDirty = false;
  }
}

// Manager de chargement dynamique des Chunks autour du joueur
const ChunkManager = {
  chunks: new Map(),
  scene: null,
  renderDistance: 5, // ~5 chunks autour du joueur

  init: function(scene) {
    this.scene = scene;
  },

  getChunkKey: function(cx, cz) {
    return `${cx},${cz}`;
  },

  getBlockGlobal: function(gx, gy, gz) {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return BLOCKS.AIR;
    let cx = Math.floor(gx / CHUNK_SIZE_X);
    let cz = Math.floor(gz / CHUNK_SIZE_Z);
    let key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk || !chunk.isGenerated) return BLOCKS.AIR;

    let lx = (gx % CHUNK_SIZE_X + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    let lz = (gz % CHUNK_SIZE_Z + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return chunk.blocks[chunk.getIndex(lx, gy, lz)];
  },

  setBlockGlobal: function(gx, gy, gz, blockType) {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return;
    let cx = Math.floor(gx / CHUNK_SIZE_X);
    let cz = Math.floor(gz / CHUNK_SIZE_Z);
    let key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) return;

    let lx = (gx % CHUNK_SIZE_X + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    let lz = (gz % CHUNK_SIZE_Z + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    chunk.setBlock(lx, gy, lz, blockType);

    // Mettre a jour le mesh du chunk
    this.rebuildChunkMesh(chunk);

    // Si le bloc est sur la bordure d'un chunk voisin, reconstruire aussi le voisin
    if (lx === 0) this.rebuildChunkKey(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.rebuildChunkKey(cx + 1, cz);
    if (lz === 0) this.rebuildChunkKey(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.rebuildChunkKey(cx, cz + 1);
  },

  rebuildChunkKey: function(cx, cz) {
    let key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (chunk) this.rebuildChunkMesh(chunk);
  },

  rebuildChunkMesh: function(chunk) {
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
    }
    if (chunk.waterMesh) {
      this.scene.remove(chunk.waterMesh);
      chunk.waterMesh.geometry.dispose();
      chunk.waterMesh = null;
    }
    chunk.buildMesh();
    if (chunk.mesh) this.scene.add(chunk.mesh);
    if (chunk.waterMesh) this.scene.add(chunk.waterMesh);
  },

  // Verification et chargement des chunks autour du joueur
  updateAroundPlayer: function(playerX, playerZ) {
    let playerCx = Math.floor(playerX / CHUNK_SIZE_X);
    let playerCz = Math.floor(playerZ / CHUNK_SIZE_Z);

    let activeKeys = new Set();

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        let cx = playerCx + dx;
        let cz = playerCz + dz;
        let key = this.getChunkKey(cx, cz);
        activeKeys.add(key);

        if (!this.chunks.has(key)) {
          let chunk = new Chunk(cx, cz);
          chunk.generateData();
          this.chunks.set(key, chunk);
          chunk.buildMesh();
          if (chunk.mesh) this.scene.add(chunk.mesh);
          if (chunk.waterMesh) this.scene.add(chunk.waterMesh);
        }
      }
    }

    // Supprimer les chunks hors de portée
    for (let [key, chunk] of this.chunks.entries()) {
      if (!activeKeys.has(key)) {
        if (chunk.mesh) {
          this.scene.remove(chunk.mesh);
          chunk.mesh.geometry.dispose();
        }
        if (chunk.waterMesh) {
          this.scene.remove(chunk.waterMesh);
          chunk.waterMesh.geometry.dispose();
        }
        this.chunks.delete(key);
      }
    }
  }
};
