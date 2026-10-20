// mobs.js - Animaux passifs (Cochon, Vache) & Monstres hostiles (Zombie)

class Mob {
  constructor(type, x, y, z) {
    this.type = type; // 'pig', 'cow', 'zombie'
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.health = (type === 'zombie') ? 20 : 10;
    this.isDead = false;

    this.mesh = this.createMesh(type);
    this.mesh.position.copy(this.position);

    this.wanderTimer = 0;
    this.targetDir = new THREE.Vector3();
  }

  createMesh(type) {
    const group = new THREE.Group();
    let matColor = 0xee9999; // Cochon
    if (type === 'cow') matColor = 0x885522;
    if (type === 'zombie') matColor = 0x228833;

    const bodyGeom = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: matColor });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    const headGeom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const head = new THREE.Mesh(headGeom, bodyMat);
    head.position.set(0, 1.1, 0.6);
    group.add(head);

    return group;
  }

  update(deltaTime, player, scene) {
    if (this.isDead) return;

    // AI de deplacement
    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 2 + Math.random() * 3;

      if (this.type === 'zombie') {
        // Attaquer le joueur s'il est proche (<20 blocs)
        let dist = this.position.distanceTo(player.position);
        if (dist < 20) {
          this.targetDir.subVectors(player.position, this.position).normalize();
          this.targetDir.y = 0;
        } else {
          let angle = Math.random() * Math.PI * 2;
          this.targetDir.set(Math.cos(angle), 0, Math.sin(angle));
        }
      } else {
        // Errancer aleatoire pour animaux
        let angle = Math.random() * Math.PI * 2;
        this.targetDir.set(Math.cos(angle), 0, Math.sin(angle));
      }
    }

    let speed = (this.type === 'zombie') ? 3.0 : 1.5;
    this.position.x += this.targetDir.x * speed * deltaTime;
    this.position.z += this.targetDir.z * speed * deltaTime;

    // Attaque au contact du Zombie
    if (this.type === 'zombie') {
      let distToPlayer = this.position.distanceTo(player.position);
      if (distToPlayer < 1.2) {
        player.takeDamage(3); // 1.5 coeurs
      }
    }

    this.mesh.position.copy(this.position);
  }

  takeDamage(amount, scene) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      scene.remove(this.mesh);

      // Drops
      if (this.type === 'pig' || this.type === 'cow') {
        playerInventory.addItem(ITEMS.RAW_MEAT, 1 + Math.floor(Math.random() * 2));
      }
    }
  }
}

const MobManager = {
  mobs: [],

  spawnMob: function(type, x, y, z, scene) {
    let mob = new Mob(type, x, y, z);
    this.mobs.push(mob);
    scene.add(mob.mesh);
  },

  update: function(deltaTime, player, scene) {
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      let mob = this.mobs[i];
      if (mob.isDead) {
        this.mobs.splice(i, 1);
      } else {
        mob.update(deltaTime, player, scene);
      }
    }
  }
};
