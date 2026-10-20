// biomes.js - Bruit procedural, Biomes, Grottes 3D, Minerais

// Simplex / Perlin Noise 2D & 3D Implementation
const PerlinNoise = (function() {
  let p = new Uint8Array(512);
  let permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
    35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,
    134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54, 65,25,63,161,1,216,80,73,209,76,132,187,208, 89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,
    250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
    189,28,42,223,183,170,213,119,248,152, 2,44,154,163,70,221,153,101,155,167,
    43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185, 112,104,218,246,
    97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,
    107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];

  function seed(s) {
    let mask = 0xff;
    for (let i = 0; i < 256; i++) {
      let v = (permutation[i] + s) & mask;
      p[i] = v;
      p[256 + i] = v;
    }
  }
  seed(12345);

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad2D(hash, x, y) {
    let h = hash & 7;
    let u = h < 4 ? x : y;
    let v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  function grad3D(hash, x, y, z) {
    let h = hash & 15;
    let u = h < 8 ? x : y;
    let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v) + ((h & 4) === 0 ? z : -z);
  }

  return {
    seed: seed,
    noise2D: function(x, y) {
      let X = Math.floor(x) & 255;
      let Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      let u = fade(x);
      let v = fade(y);
      let A = p[X] + Y, B = p[X + 1] + Y;
      return lerp(v, lerp(u, grad2D(p[A], x, y), grad2D(p[B], x - 1, y)),
                     lerp(u, grad2D(p[A + 1], x, y - 1), grad2D(p[B + 1], x - 1, y - 1)));
    },
    noise3D: function(x, y, z) {
      let X = Math.floor(x) & 255;
      let Y = Math.floor(y) & 255;
      let Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      let u = fade(x);
      let v = fade(y);
      let w = fade(z);
      let A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      let B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

      return lerp(w, lerp(v, lerp(u, grad3D(p[AA], x, y, z), grad3D(p[BA], x - 1, y, z)),
                             lerp(u, grad3D(p[AB], x, y - 1, z), grad3D(p[BB], x - 1, y - 1, z))),
                     lerp(v, lerp(u, grad3D(p[AA + 1], x, y, z - 1), grad3D(p[BA + 1], x - 1, y, z - 1)),
                             lerp(u, grad3D(p[AB + 1], x, y - 1, z - 1), grad3D(p[BB + 1], x - 1, y - 1, z - 1))));
    }
  };
})();

// Types de biomes
const BIOMES = {
  PLAINS: { id: 0, name: "Plaines", heightScale: 8, heightOffset: 24, treeChance: 0.01, flowerChance: 0.03 },
  FOREST: { id: 1, name: "Forêt Dense", heightScale: 12, heightOffset: 26, treeChance: 0.08, mushroomChance: 0.02 },
  DESERT: { id: 2, name: "Désert", heightScale: 6, heightOffset: 22, cactusChance: 0.015 },
  MOUNTAINS: { id: 3, name: "Montagnes", heightScale: 28, heightOffset: 32, snowLevel: 46 },
  OCEAN: { id: 4, name: "Océan / Lac", heightScale: 4, heightOffset: 15, waterLevel: 22 }
};

// Types de blocs
const BLOCKS = {
  AIR: 0,
  DIRT: 1,
  GRASS: 2,
  STONE: 3,
  SAND: 4,
  WOOD: 5,
  LEAVES: 6,
  PLANKS: 7,
  GLASS: 8,
  BRICKS: 9,
  ORE_COAL: 10,
  ORE_IRON: 11,
  ORE_GOLD: 12,
  ORE_DIAMOND: 13,
  BEDROCK: 14,
  SNOW: 15,
  CACTUS: 16,
  WORKBENCH: 17,
  FURNACE: 18,
  WATER: 19,
  LAVA: 20
};

const WorldGen = {
  currentSeed: 12345,

  setSeed: function(seed) {
    this.currentSeed = seed;
    PerlinNoise.seed(seed);
  },

  // Multi-octave 2D noise
  fbm2D: function(x, z, octaves = 4, persistence = 0.5, scale = 0.01) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += PerlinNoise.noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  },

  // Multi-octave 3D noise (pour les grottes)
  fbm3D: function(x, y, z, octaves = 3, scale = 0.04) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    for (let i = 0; i < octaves; i++) {
      total += PerlinNoise.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total;
  },

  // Obtenir le biome en (x, z)
  getBiome: function(x, z) {
    let temp = this.fbm2D(x + 500, z + 500, 2, 0.5, 0.003);
    let moist = this.fbm2D(x - 500, z - 500, 2, 0.5, 0.003);

    if (temp < -0.2) return BIOMES.MOUNTAINS;
    if (temp > 0.35) return BIOMES.DESERT;
    if (moist < -0.25) return BIOMES.OCEAN;
    if (moist > 0.15) return BIOMES.FOREST;
    return BIOMES.PLAINS;
  },

  // Obtenir la hauteur du terrain en (x, z)
  getTerrainHeight: function(x, z) {
    let biome = this.getBiome(x, z);
    let baseNoise = this.fbm2D(x, z, 4, 0.5, 0.008); // -1.0 à 1.0
    let detailNoise = this.fbm2D(x + 100, z + 100, 2, 0.5, 0.03);

    let h = biome.heightOffset + (baseNoise * biome.heightScale) + (detailNoise * 3);
    return Math.floor(Math.max(1, Math.min(60, h)));
  },

  // Determiner si un point est une grotte (bruit 3D)
  isCave: function(x, y, z, surfaceHeight) {
    if (y <= 1 || y >= surfaceHeight - 2) return false; // Ne pas percer la surface ni le fond
    let caveVal = this.fbm3D(x, y, z, 2, 0.045);
    return caveVal > 0.35;
  },

  // Minerai a une position (x, y, z)
  getOreType: function(x, y, z) {
    let n = Math.abs(PerlinNoise.noise3D(x * 0.1, y * 0.1, z * 0.1));
    if (n < 0.65) return BLOCKS.STONE;

    // Frequences selon la profondeur y
    if (y < 12 && n > 0.88) return BLOCKS.ORE_DIAMOND;
    if (y < 25 && n > 0.80) return BLOCKS.ORE_GOLD;
    if (y < 40 && n > 0.72) return BLOCKS.ORE_IRON;
    if (y < 52 && n > 0.66) return BLOCKS.ORE_COAL;

    return BLOCKS.STONE;
  }
};
