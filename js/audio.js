/** Audio con archivos MP3 + efectos procedurales en batalla */

const BGM_SRC = "background-song.mp3";
const CLICK_SRC = "click.mp3";
const OPTION_CLICK_SRC = "text-option-click.mp3";
const WINNER_SRC = "winner.mp3";
const GAME_OVER_SRC = "game-over.mp3";
const VOLUME_STORAGE_KEY = "janken-bgm-volume";

let bgMusic = null;
let clickSound = null;
let optionClickSound = null;
let musicOn = false;
let musicVolume = 0.45;

function loadSavedVolume() {
  const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
  if (saved !== null) {
    const v = parseFloat(saved);
    if (!Number.isNaN(v) && v >= 0 && v <= 1) musicVolume = v;
  }
}

loadSavedVolume();

function getBgMusic() {
  if (!bgMusic) {
    bgMusic = new Audio(BGM_SRC);
    bgMusic.loop = true;
    bgMusic.volume = musicVolume;
    bgMusic.preload = "auto";
  }
  return bgMusic;
}

function getClickSound() {
  if (!clickSound) {
    clickSound = new Audio(CLICK_SRC);
    clickSound.volume = 0.65;
    clickSound.preload = "auto";
  }
  return clickSound;
}

function getOptionClickSound() {
  if (!optionClickSound) {
    optionClickSound = new Audio(OPTION_CLICK_SRC);
    optionClickSound.volume = 0.7;
    optionClickSound.preload = "auto";
  }
  return optionClickSound;
}

export function unlockAudio() {
  getBgMusic();
  getClickSound();
  getOptionClickSound();
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(value) {
  musicVolume = Math.max(0, Math.min(1, value));
  const bg = bgMusic;
  if (bg) bg.volume = musicVolume;
  localStorage.setItem(VOLUME_STORAGE_KEY, String(musicVolume));
}

export function playClickSound() {
  const base = getClickSound();
  const s = base.cloneNode();
  s.volume = base.volume;
  s.play().catch(() => {});
}

export function playOptionClickSound() {
  const base = getOptionClickSound();
  const s = base.cloneNode();
  s.volume = base.volume;
  s.play().catch(() => {});
}

export function startMusic() {
  const bg = getBgMusic();
  bg.volume = musicVolume;
  if (musicOn) return;
  musicOn = true;
  bg.play().catch(() => {
    musicOn = false;
  });
}

export function stopMusic() {
  musicOn = false;
  const bg = getBgMusic();
  bg.pause();
  bg.currentTime = 0;
}

export function toggleMusic() {
  if (musicOn) {
    stopMusic();
    return false;
  }
  startMusic();
  return true;
}

export function isMusicPlaying() {
  return musicOn;
}

/* Efectos de batalla (procedurales) */
let ctx = null;
let sfxGain = null;

function initSfx() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  ctx = new AudioCtx();
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.35;
  sfxGain.connect(ctx.destination);
}

function playTone(freq, duration, type, peak = 0.3) {
  initSfx();
  if (!ctx || !sfxGain) return;
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Mensajes de batalla y グー／パー／チョキ */
export function playMoveSound() {
  playOptionClickSound();
}

export function playConfirmSound() {
  playOptionClickSound();
}

export function playHitSound() {
  playTone(120, 0.15, "sawtooth", 0.2);
}

function playOneShot(src, volume = 0.85) {
  unlockAudio();
  const s = new Audio(src);
  s.volume = volume;
  s.play().catch(() => {});
}

export function playWinnerSound() {
  playOneShot(WINNER_SRC);
}

export function playGameOverSound() {
  playOneShot(GAME_OVER_SRC);
}
