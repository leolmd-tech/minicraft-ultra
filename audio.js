// audio.js - Synthetiseur sonore Web Audio API sans aucun fichier audio externe

const AudioEngine = {
  ctx: null,

  init: function() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API non supportee');
    }
  },

  playTone: function(freq, duration, type = 'sine', volume = 0.1) {
    if (!this.ctx) return;
    let osc = this.ctx.createOscillator();
    let gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playBreakSound: function() {
    this.playTone(120, 0.1, 'square', 0.2);
  },

  playPlaceSound: function() {
    this.playTone(220, 0.08, 'sine', 0.15);
  },

  playJumpSound: function() {
    this.playTone(300, 0.12, 'triangle', 0.1);
  },

  playHurtSound: function() {
    this.playTone(150, 0.25, 'sawtooth', 0.3);
  }
};

AudioEngine.init();
