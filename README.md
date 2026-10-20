# MiniCraft Ultra 🎮

Un clone complet de Minecraft en HTML5, CSS3, JavaScript ES6 et Three.js (via CDN), 100% navigateur, responsive PC & Mobile, gratuit et sans installation.

---

## 🚀 Fonctionnalités Principales

### 1. Moteur & Monde Voxel Géant
- **Système de Chunks 16x16x64** avec chargement et déchargement dynamique autour du joueur (rendu quasi-infini).
- **Génération Procédurale par Bruit Multi-Octaves** (Simplex / Perlin) avec seed paramétrable.
- **Biomes Diversifiés** :
  - **Plaines** : Herbe, fleurs, arbres épars.
  - **Forêt Dense** : Arbres nombreux.
  - **Désert** : Dunes de sable, cactus.
  - **Montagnes** : Sommets élevés et neige.
  - **Océan / Lac** : Eau semi-transparente.
- **Sous-Sol & Minerais** : Grottes 3D, poches de minerais (Charbon, Fer, Or, Diamant), Lave et Bedrock incassable.
- **Optimisation Rendu** : Suppression des faces cachées (Hidden-face Culling) et Soft Ambient Occlusion (AO).

### 2. Visuels & Ambiance
- **Textures 16x16 Pixel-Art** générées intégralement en Canvas (aucun asset externe nécessaire).
- **Cycle Jour / Nuit** avec éclairage directionnel dynamique et dégradés de ciel.
- **Synthesizer Audio** via Web Audio API pour les bruits de pas, casse de bloc, saut, dégâts et artisanat.

### 3. Contrôles & Survie
- **PC** : ZQSD / WASD, Souris (Pointer Lock), Espace (Saut / Vol), Maj (Sprint), Ctrl (Sneak), Touche E (Inventaire), F3 (Debug).
- **Mobile** : Joystick virtuel à gauche, glisser à droite pour orienter la caméra, boutons tactiles pour sauter, voler, casser, poser et ouvrir l'inventaire.
- **Physique & Survie** : Collisions AABB, gravité, dégâts de chute (> 4 blocs), cœurs de vie (10) et barre de faim (10) avec régénération lente.

### 4. Inventaire, Artisanat & Fours
- **Inventaire 36 Slots** + Barre d'accès rapide (9 slots).
- **Table de Craft 3x3 & Artisanat 2x2** avec recettes en grille.
- **Outils & Durabilité** : Pioches, Haches, Épées (Bois, Pierre, Fer, Diamant).
- **Fourneau** pour la cuisson et la fonte des minerais.

### 5. Mobs & Combat
- **Animaux Passifs** (Cochon, Vache) avec viande à récolter.
- **Zombies Hostiles** qui poursuivent le joueur la nuit et attaquent au contact.

### 6. Sauvegarde
- **Sauvegarde Automatique** dans `localStorage` toutes les 30 secondes (position, inventaire, temps, blocs modifiés).

---

## 🌍 Comment Activer GitHub Pages

Pour héberger et jouer à MiniCraft Ultra gratuitement sur GitHub :

1. Déposez tous les fichiers du projet sur votre dépôt GitHub (`main` branch).
2. Rendez-vous dans les **Settings** de votre dépôt.
3. Cliquez sur l'onglet **Pages** dans le menu de gauche.
4. Sous **Build and deployment / Source**, sélectionnez **Deploy from a branch**.
5. Sélectionnez la branche **`main`** et le dossier **`/ (root)`**, puis cliquez sur **Save**.
6. En quelques secondes, votre jeu est accessible en ligne via l'URL GitHub Pages fournie !

---

## 🛠 Structure des Fichiers

```
├── index.html       # Shell HTML, styles CSS responsive & fenêtres UI
├── textures.js     # Générateur de textures pixel-art 16x16 & Texture Atlas
├── biomes.js       # Bruit de Perlin multi-octaves, biomes & grottes 3D
├── chunks.js       # Structure de Chunk, Culling des faces & Manager
├── physique.js     # Moteur physique AABB, gravité, saut & collisions
├── joueur.js       # Statut du joueur, santé, faim, vol & dégâts
├── controles.js    # Contrôles PC (Pointer Lock) & Mobile (Joystick)
├── inventaire.js   # Gestionnaire d'inventaire, outils & durabilité
├── craft.js        # Moteur de recettes de craft 2x2/3x3 & fourneau
├── mobs.js         # IA des animaux passifs & zombies hostiles
├── audio.js        # Synthétiseur de sons Web Audio API
├── sauvegarde.js   # Sauvegarde & Chargement LocalStorage
├── ui.js           # Gestion du HUD, fenêtres, F3 & boussole
└── moteur.js       # Boucle de jeu principal, rendu Three.js & raycasting
```
