// physique.js - Physique AABB, Collisions, Gravite, Saut, Vol, Degats de chute

const Physics = {
  gravity: -24.0,
  terminalVelocity: -40.0,

  // AABB (Axis-Aligned Bounding Box) Collision Test
  checkAABBCollision: function(box1, box2) {
    return (
      box1.minX < box2.maxX && box1.maxX > box2.minX &&
      box1.minY < box2.maxY && box1.maxY > box2.minY &&
      box1.minZ < box2.maxZ && box1.maxZ > box2.minZ
    );
  },

  // Generer AABB du joueur
  getPlayerAABB: function(position) {
    const width = 0.6;
    const height = 1.8;
    return {
      minX: position.x - width / 2,
      maxX: position.x + width / 2,
      minY: position.y,
      maxY: position.y + height,
      minZ: position.z - width / 2,
      maxZ: position.z + width / 2
    };
  },

  // Tester si un bloc en (x,y,z) est solide pour les collisions
  isSolidBlock: function(x, y, z) {
    let block = ChunkManager.getBlockGlobal(x, y, z);
    return (
      block !== BLOCKS.AIR &&
      block !== BLOCKS.WATER &&
      block !== BLOCKS.LAVA
    );
  },

  // Appliquer le deplacement avec collisions bloc par bloc
  applyPlayerMovement: function(player, velocity, deltaTime) {
    if (player.isFlying) {
      // Mode Vol : Pas de gravite ni collisions fortes
      player.position.x += velocity.x * deltaTime;
      player.position.y += velocity.y * deltaTime;
      player.position.z += velocity.z * deltaTime;
      return;
    }

    // Tester s'il nage dans l'eau
    let eyeBlock = ChunkManager.getBlockGlobal(
      Math.floor(player.position.x),
      Math.floor(player.position.y + 1.2),
      Math.floor(player.position.z)
    );
    player.isInWater = (eyeBlock === BLOCKS.WATER);

    if (player.isInWater) {
      velocity.y *= 0.8; // Resistance de l'eau
    } else {
      // Gravite normale
      velocity.y += this.gravity * deltaTime;
      velocity.y = Math.max(velocity.y, this.terminalVelocity);
    }

    // Subdiviser le deplacement pour eviter de traverser les murs
    let steps = 4;
    let subDelta = deltaTime / steps;

    for (let s = 0; s < steps; s++) {
      // 1. Axe X
      player.position.x += velocity.x * subDelta;
      let playerBoxX = this.getPlayerAABB(player.position);
      if (this.checkTerrainCollision(playerBoxX)) {
        player.position.x -= velocity.x * subDelta;
        velocity.x = 0;
      }

      // 2. Axe Z
      player.position.z += velocity.z * subDelta;
      let playerBoxZ = this.getPlayerAABB(player.position);
      if (this.checkTerrainCollision(playerBoxZ)) {
        player.position.z -= velocity.z * subDelta;
        velocity.z = 0;
      }

      // 3. Axe Y
      player.position.y += velocity.y * subDelta;
      let playerBoxY = this.getPlayerAABB(player.position);
      if (this.checkTerrainCollision(playerBoxY)) {
        if (velocity.y < 0) {
          // Atterrissage au sol
          player.isGrounded = true;

          // Calculus degats de chute si vitesse de chute forte
          if (player.fallDistance > 4.0) {
            let fallDamage = Math.floor(player.fallDistance - 4.0);
            if (fallDamage > 0) {
              player.takeDamage(fallDamage);
            }
          }
          player.fallDistance = 0;
        }
        player.position.y -= velocity.y * subDelta;
        velocity.y = 0;
      } else {
        if (velocity.y < 0) {
          player.isGrounded = false;
          player.fallDistance += Math.abs(velocity.y * subDelta);
        } else {
          player.isGrounded = false;
        }
      }
    }
  },

  // Verification de collision terrain autour de la box du joueur
  checkTerrainCollision: function(box) {
    let minX = Math.floor(box.minX);
    let maxX = Math.floor(box.maxX);
    let minY = Math.floor(box.minY);
    let maxY = Math.floor(box.maxY);
    let minZ = Math.floor(box.minZ);
    let maxZ = Math.floor(box.maxZ);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isSolidBlock(x, y, z)) {
            let blockBox = {
              minX: x, maxX: x + 1,
              minY: y, maxY: y + 1,
              minZ: z, maxZ: z + 1
            };
            if (this.checkAABBCollision(box, blockBox)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
};
