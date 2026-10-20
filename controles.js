// controles.js - Gestion des controles PC (Pointer Lock + Clavier) et Mobile (Joystick Touch)

const Controls = {
  isMobile: false,
  keys: {},
  mouseSens: 0.002,

  // Mobile Touch States
  joystickActive: false,
  joystickTouchId: null,
  joystickVector: { x: 0, y: 0 },
  cameraTouchId: null,
  lastTouchX: 0,
  lastTouchY: 0,

  init: function(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    // Detection mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (this.isMobile) {
      document.getElementById('mobile-controls').style.display = 'block';
      this.setupMobileControls();
    } else {
      this.setupPCControls();
    }
  },

  setupPCControls: function() {
    const self = this;

    // Pointer Lock sur clic canvas
    this.canvas.addEventListener('click', () => {
      if (!mainPlayer.isDead && document.pointerLockElement !== self.canvas) {
        self.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      self.isPointerLocked = (document.pointerLockElement === self.canvas);
    });

    // Mouvement Souris
    document.addEventListener('mousemove', (e) => {
      if (!self.isPointerLocked) return;

      mainPlayer.yaw -= e.movementX * self.mouseSens;
      mainPlayer.pitch -= e.movementY * self.mouseSens;

      // Limiter l'angle vertical (-89 deg a +89 deg)
      const maxPitch = Math.PI / 2 - 0.05;
      mainPlayer.pitch = Math.max(-maxPitch, Math.min(maxPitch, mainPlayer.pitch));
    });

    // Clavier Keydown / Keyup
    window.addEventListener('keydown', (e) => {
      self.keys[e.code] = true;

      // Double-Tap Espace pour Mode Vol
      if (e.code === 'Space') {
        let now = performance.now();
        if (now - mainPlayer.lastSpacePressTime < 300) {
          mainPlayer.isFlying = !mainPlayer.isFlying;
          mainPlayer.velocity.y = 0;
        }
        mainPlayer.lastSpacePressTime = now;
      }

      // Touche E pour ouvrir/fermer inventaire
      if (e.code === 'KeyE') {
        if (typeof UI !== 'undefined') UI.toggleInventory();
      }

      // Touche F3 pour overlay de debug
      if (e.code === 'F3') {
        e.preventDefault();
        if (typeof UI !== 'undefined') UI.toggleDebug();
      }
    });

    window.addEventListener('keyup', (e) => {
      self.keys[e.code] = false;
    });
  },

  setupMobileControls: function() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    // Touch Joystick gauche
    joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      let touch = e.changedTouches[0];
      this.joystickActive = true;
      this.joystickTouchId = touch.identifier;
      this.updateJoystick(touch, joystickBase, joystickStick);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystick(touch, joystickBase, joystickStick);
        } else if (touch.identifier === this.cameraTouchId) {
          // Camera Drag Droite
          let dx = touch.clientX - this.lastTouchX;
          let dy = touch.clientY - this.lastTouchY;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;

          mainPlayer.yaw -= dx * 0.005;
          mainPlayer.pitch -= dy * 0.005;
          const maxPitch = Math.PI / 2 - 0.05;
          mainPlayer.pitch = Math.max(-maxPitch, Math.min(maxPitch, mainPlayer.pitch));
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          this.joystickVector = { x: 0, y: 0 };
          joystickStick.style.transform = `translate(0px, 0px)`;
        } else if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    });

    // Touch Zone Camera (Moitie droite de l'ecran)
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        let touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth / 2 && this.cameraTouchId === null) {
          this.cameraTouchId = touch.identifier;
          this.lastTouchX = touch.clientX;
          this.lastTouchY = touch.clientY;
        }
      }
    });

    // Boutons Mobile
    document.getElementById('btn-mobile-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys['Space'] = true;
    });
    document.getElementById('btn-mobile-jump').addEventListener('touchend', (e) => {
      this.keys['Space'] = false;
    });

    document.getElementById('btn-mobile-fly').addEventListener('touchstart', (e) => {
      e.preventDefault();
      mainPlayer.isFlying = !mainPlayer.isFlying;
      mainPlayer.velocity.y = 0;
    });

    document.getElementById('btn-mobile-inv').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (typeof UI !== 'undefined') UI.toggleInventory();
    });
  },

  updateJoystick: function(touch, base, stick) {
    let rect = base.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    let maxDist = rect.width / 2;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    stick.style.transform = `translate(${dx}px, ${dy}px)`;

    this.joystickVector.x = dx / maxDist;
    this.joystickVector.y = dy / maxDist;
  },

  updatePlayerMovement: function(deltaTime) {
    if (mainPlayer.isDead) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.isMobile) {
      moveX = this.joystickVector.x;
      moveZ = this.joystickVector.y;
    } else {
      if (this.keys['KeyW'] || this.keys['KeyZ']) moveZ -= 1;
      if (this.keys['KeyS']) moveZ += 1;
      if (this.keys['KeyA'] || this.keys['KeyQ']) moveX -= 1;
      if (this.keys['KeyD']) moveX += 1;
    }

    // Normaliser si diagonale
    let len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 1.0) {
      moveX /= len;
      moveZ /= len;
    }

    // Modificateurs de vitesse
    mainPlayer.isSprinting = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    mainPlayer.isSneaking = !!this.keys['ControlLeft'] || !!this.keys['ControlRight'];

    let speed = 4.3; // Vitesse de marche normale
    if (mainPlayer.isSprinting) speed *= 1.4;
    if (mainPlayer.isSneaking) speed *= 0.4;
    if (mainPlayer.isFlying) speed *= 2.5;

    // Calcul de la direction relative a la camera
    let forwardX = -Math.sin(mainPlayer.yaw);
    let forwardZ = -Math.cos(mainPlayer.yaw);
    let rightX = Math.cos(mainPlayer.yaw);
    let rightZ = -Math.sin(mainPlayer.yaw);

    let vx = (forwardX * moveZ + rightX * moveX) * speed;
    let vz = (forwardZ * moveZ + rightZ * moveX) * speed;

    mainPlayer.velocity.x = vx;
    mainPlayer.velocity.z = vz;

    // Saut / Vol vertical
    if (this.keys['Space']) {
      if (mainPlayer.isFlying) {
        mainPlayer.velocity.y = speed;
      } else if (mainPlayer.isGrounded || mainPlayer.isInWater) {
        mainPlayer.velocity.y = 8.2; // Hauteur de saut ~1.2 blocs
        mainPlayer.isGrounded = false;
        if (typeof AudioEngine !== 'undefined') AudioEngine.playJumpSound();
      }
    } else if (mainPlayer.isSneaking && mainPlayer.isFlying) {
      mainPlayer.velocity.y = -speed;
    } else if (mainPlayer.isFlying) {
      mainPlayer.velocity.y = 0;
    }

    // Appliquer la physique & collisions
    Physics.applyPlayerMovement(mainPlayer, mainPlayer.velocity, deltaTime);

    // Mettre a jour la camera Three.js
    let eyeHeight = mainPlayer.isSneaking ? 1.4 : 1.62;
    this.camera.position.set(mainPlayer.position.x, mainPlayer.position.y + eyeHeight, mainPlayer.position.z);

    // Rotation camera par Quaternions
    let euler = new THREE.Euler(mainPlayer.pitch, mainPlayer.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
};
