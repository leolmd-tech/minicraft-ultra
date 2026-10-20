// joueur.js - Gestion du joueur, vie (10 coeurs = 20 HP), faim (10 gigots = 20 pts), statistiques

class Player {
  constructor() {
    this.position = new THREE.Vector3(0, 40, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;   // Rotation Y
    this.pitch = 0; // Rotation X

    // Stats de survie (Max 20 = 10 icônes x 2)
    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;

    // Etats
    this.isDead = false;
    this.isFlying = false;
    this.isSprinting = false;
    this.isSneaking = false;
    this.isGrounded = false;
    this.isInWater = false;
    this.fallDistance = 0;

    // Horloges Internes
    this.survivalTimer = 0;
    this.lastSpacePressTime = 0;
  }

  reset(spawnX = 0, spawnZ = 0) {
    let surfaceY = WorldGen.getTerrainHeight(spawnX, spawnZ);
    this.position.set(spawnX + 0.5, surfaceY + 3.0, spawnZ + 0.5);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.isDead = false;
    this.isFlying = false;
    this.fallDistance = 0;
  }

  takeDamage(amount) {
    if (this.isDead || this.isFlying) return;
    this.health -= amount;
    if (typeof AudioEngine !== 'undefined') AudioEngine.playHurtSound();

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eat(foodAmount) {
    if (this.isDead) return;
    this.hunger = Math.min(this.maxHunger, this.hunger + foodAmount);
    this.heal(2);
  }

  die() {
    this.isDead = true;
    if (typeof UI !== 'undefined') {
      UI.showDeathScreen();
    }
  }

  // Boucle de survie (Faim & Regénération lente)
  updateSurvivalStats(deltaTime) {
    if (this.isDead) return;

    this.survivalTimer += deltaTime;
    if (this.survivalTimer >= 4.0) { // Toutes les 4 secondes
      this.survivalTimer = 0;

      // Consommation de faim (plus rapide en sprint)
      if (this.isSprinting) {
        this.hunger = Math.max(0, this.hunger - 1);
      } else if (Math.random() < 0.3) {
        this.hunger = Math.max(0, this.hunger - 1);
      }

      // Regénération de vie si faim > 15
      if (this.hunger >= 15 && this.health < this.maxHealth) {
        this.heal(1);
      }

      // Degats d'inanition si faim === 0
      if (this.hunger === 0 && this.health > 1) {
        this.takeDamage(1);
      }
    }
  }
}

const mainPlayer = new Player();
