import {
  unlockAudio,
  startMusic,
  toggleMusic,
  isMusicPlaying,
  getMusicVolume,
  setMusicVolume,
  playClickSound,
  playMoveSound,
  playConfirmSound,
  playHitSound,
  playWinnerSound,
  playGameOverSound,
} from "./audio.js";

const SKIN_COUNT = 5;
const WINS_TO_VICTORY = 3;

const USER_IMAGES = Array.from({ length: SKIN_COUNT }, (_, i) => `user${i + 1}.png`);
const ENEMY_IMAGES = Array.from({ length: SKIN_COUNT }, (_, i) => `enemy${i + 1}.png`);

const MOVES = {
  rock: { label: "グー", emoji: "✊", beats: "scissors" },
  paper: { label: "パー", emoji: "✋", beats: "rock" },
  scissors: { label: "チョキ", emoji: "✌️", beats: "paper" },
};

const MOVE_KEYS = Object.keys(MOVES);

const MSG = {
  whatWillYouDo: "どうする？",
  wildAppeared: "しれいとれたーが あらわれた！",
  enemyChanged: "あいてが すがたを かえた！",
  youUsed: (move) => `じぶんは ${formatMove(move)} を だした！`,
  enemyUsed: (move) => `あいては ${formatMove(move)} を だした！`,
  draw: "あいこ！ ダメージは ない！",
  winRound: "こうかばつぐん！ かち！",
  loseRound: "あいての こうげき！ まけ…",
  rematch: "リベンジ！ あいてが すがたを かえた！",
};

function formatMove(moveKey) {
  const m = MOVES[moveKey];
  return `${m.emoji}${m.label}`;
}

const state = {
  userSkin: null,
  enemySkin: 0,
  userWins: 0,
  enemyWins: 0,
  busy: false,
  matchOver: false,
  waitingClick: false,
};

const $ = (sel) => document.querySelector(sel);

const screenSelect = $("#screen-select");
const screenBattle = $("#screen-battle");
const skinGrid = $("#skin-grid");
const btnStart = $("#btn-start");
const spriteUser = $("#sprite-user");
const spriteEnemy = $("#sprite-enemy");
const messageText = $("#message-text");
const messageBox = $("#message-box");
const messageHint = $("#message-hint");
const menuFight = $("#menu-fight");
const menuResult = $("#menu-result");
const battleUi = document.querySelector(".battle-ui");
const userHpFill = $("#user-hp-fill");
const enemyHpFill = $("#enemy-hp-fill");
const userScoreEl = $("#user-score");
const enemyScoreEl = $("#enemy-score");
const btnMusic = $("#btn-music");
const volumeSlider = $("#volume-slider");
const endOverlay = $("#end-overlay");
const endTitle = $("#end-title");

let clickResolver = null;

function setUserSkin(index) {
  spriteUser.src = USER_IMAGES[index];
  spriteUser.dataset.skin = String(index);
}

function setEnemySkin(index) {
  spriteEnemy.src = ENEMY_IMAGES[index];
  spriteEnemy.dataset.skin = String(index);
}

function randomSkin(exclude = null) {
  let skin;
  do {
    skin = Math.floor(Math.random() * SKIN_COUNT);
  } while (exclude !== null && skin === exclude && SKIN_COUNT > 1);
  return skin;
}

function buildSkinSelector() {
  skinGrid.innerHTML = "";
  for (let i = 0; i < SKIN_COUNT; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "skin-option";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", "false");
    btn.dataset.skin = String(i);
    btn.title = `なかま${i + 1}`;

    const img = document.createElement("img");
    img.src = USER_IMAGES[i];
    img.alt = `なかま${i + 1}`;
    img.draggable = false;
    btn.appendChild(img);

    btn.addEventListener("click", () => {
      unlockAudio();
      playClickSound();
      selectSkin(i);
    });
    skinGrid.appendChild(btn);
  }
}

function selectSkin(index) {
  state.userSkin = index;
  skinGrid.querySelectorAll(".skin-option").forEach((el, i) => {
    const selected = i === index;
    el.classList.toggle("selected", selected);
    el.setAttribute("aria-selected", selected ? "true" : "false");
  });
  btnStart.disabled = false;
}

function showScreen(name) {
  const isSelect = name === "select";
  screenSelect.classList.toggle("active", isSelect);
  screenSelect.hidden = !isSelect;
  screenBattle.classList.toggle("active", !isSelect);
  screenBattle.hidden = isSelect;
  if (isSelect) setWaitingClick(false);
}

function updateScoreBars() {
  const userPct = (state.userWins / WINS_TO_VICTORY) * 100;
  const enemyPct = (state.enemyWins / WINS_TO_VICTORY) * 100;
  userHpFill.style.width = `${Math.min(userPct, 100)}%`;
  enemyHpFill.style.width = `${Math.min(enemyPct, 100)}%`;
  userScoreEl.textContent = `${state.userWins} / ${WINS_TO_VICTORY}`;
  enemyScoreEl.textContent = `${state.enemyWins} / ${WINS_TO_VICTORY}`;
  enemyHpFill.style.background =
    enemyPct >= 66 ? "var(--hp-red)" : enemyPct > 0 ? "var(--hp-yellow)" : "var(--hp-green)";
}

function setMessage(text) {
  messageText.textContent = text;
}

function setWaitingClick(waiting) {
  state.waitingClick = waiting;
  messageBox.classList.toggle("waiting", waiting);
  messageBox.setAttribute("aria-busy", waiting ? "true" : "false");
  if (messageHint) messageHint.hidden = !waiting;
}

function waitForClick() {
  setWaitingClick(true);
  return new Promise((resolve) => {
    clickResolver = resolve;
  });
}

function onMessageClick() {
  if (!state.waitingClick || !clickResolver) return;
  playConfirmSound();
  setWaitingClick(false);
  const resolve = clickResolver;
  clickResolver = null;
  resolve();
}

function lockFight(locked) {
  state.busy = locked;
  battleUi.classList.toggle("locked", locked);
  menuFight.querySelectorAll(".cmd-btn").forEach((btn) => {
    btn.disabled = locked;
  });
}

function pickEnemyMove() {
  return MOVE_KEYS[Math.floor(Math.random() * MOVE_KEYS.length)];
}

function resolveRound(userMove, enemyMove) {
  if (userMove === enemyMove) return "draw";
  if (MOVES[userMove].beats === enemyMove) return "win";
  return "lose";
}

async function playAttackAnim(sprite) {
  sprite.classList.add("attack");
  await waitForClick();
  sprite.classList.remove("attack");
}

async function showBattleMessage(text) {
  setMessage(text);
  await waitForClick();
}

async function playRound(userMove) {
  if (state.busy || state.matchOver) return;

  playMoveSound(userMove);
  lockFight(true);
  menuResult.hidden = true;

  const enemyMove = pickEnemyMove();

  setMessage(MSG.youUsed(userMove));
  await playAttackAnim(spriteUser);

  setMessage(MSG.enemyUsed(enemyMove));
  await playAttackAnim(spriteEnemy);

  const outcome = resolveRound(userMove, enemyMove);

  if (outcome === "draw") {
    await showBattleMessage(MSG.draw);
  } else if (outcome === "win") {
    state.userWins++;
    spriteEnemy.classList.add("hit");
    playHitSound();
    await showBattleMessage(MSG.winRound);
    spriteEnemy.classList.remove("hit");
  } else {
    state.enemyWins++;
    spriteUser.classList.add("hit");
    playHitSound();
    await showBattleMessage(MSG.loseRound);
    spriteUser.classList.remove("hit");
  }

  updateScoreBars();

  if (state.userWins >= WINS_TO_VICTORY) {
    state.matchOver = true;
    showEndScreen("winner");
    return;
  }
  if (state.enemyWins >= WINS_TO_VICTORY) {
    state.matchOver = true;
    showEndScreen("gameover");
    return;
  }

  await showBattleMessage(MSG.whatWillYouDo);
  lockFight(false);
}

function showEndScreen(type) {
  const isWin = type === "winner";
  endTitle.textContent = isWin ? "WINNER" : "GAME OVER";
  endOverlay.classList.toggle("end-overlay--win", isWin);
  endOverlay.classList.toggle("end-overlay--lose", !isWin);
  endOverlay.hidden = false;
  endOverlay.setAttribute("aria-hidden", "false");

  if (isWin) playWinnerSound();
  else playGameOverSound();

  setMessage(isWin ? "WINNER!" : "GAME OVER");
  menuResult.hidden = true;
}

function hideEndScreen() {
  endOverlay.hidden = true;
  endOverlay.setAttribute("aria-hidden", "true");
  endOverlay.classList.remove("end-overlay--win", "end-overlay--lose");
}

async function startBattle() {
  unlockAudio();
  playClickSound();
  startMusic();
  updateMusicButton();

  state.userWins = 0;
  state.enemyWins = 0;
  state.busy = false;
  state.matchOver = false;
  menuResult.hidden = true;
  hideEndScreen();

  setUserSkin(state.userSkin);
  rollEnemySkin();
  updateScoreBars();
  showScreen("battle");
  lockFight(true);

  await showBattleMessage(MSG.wildAppeared);
  await showBattleMessage(MSG.enemyChanged);
  await showBattleMessage(MSG.whatWillYouDo);
  lockFight(false);
}

function rollEnemySkin() {
  const prev = state.enemySkin;
  state.enemySkin = randomSkin(prev);
  setEnemySkin(state.enemySkin);
}

async function rematch() {
  playClickSound();
  hideEndScreen();
  state.userWins = 0;
  state.enemyWins = 0;
  state.matchOver = false;
  menuResult.hidden = true;
  rollEnemySkin();
  updateScoreBars();
  lockFight(true);
  await showBattleMessage(MSG.rematch);
  await showBattleMessage(MSG.whatWillYouDo);
  lockFight(false);
}

function updateMusicButton() {
  if (!btnMusic) return;
  btnMusic.textContent = isMusicPlaying() ? "♪ ON" : "♪ OFF";
  btnMusic.setAttribute("aria-pressed", isMusicPlaying() ? "true" : "false");
}

function initVolumeSlider() {
  if (!volumeSlider) return;
  const pct = Math.round(getMusicVolume() * 100);
  volumeSlider.value = String(pct);
  volumeSlider.setAttribute("aria-valuenow", String(pct));

  volumeSlider.addEventListener("input", () => {
    const v = Number(volumeSlider.value) / 100;
    setMusicVolume(v);
    volumeSlider.setAttribute("aria-valuenow", volumeSlider.value);
    unlockAudio();
    if (v > 0 && !isMusicPlaying() && screenBattle.classList.contains("active")) {
      startMusic();
      updateMusicButton();
    }
  });
}

function init() {
  buildSkinSelector();
  initVolumeSlider();

  messageBox.addEventListener("click", onMessageClick);
  messageBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onMessageClick();
    }
  });

  btnStart.addEventListener("click", () => {
    if (state.userSkin === null) return;
    unlockAudio();
    startBattle();
  });

  menuFight.querySelectorAll(".cmd-btn").forEach((btn) => {
    btn.addEventListener("click", () => playRound(btn.dataset.move));
  });

  $("#btn-next-round").addEventListener("click", () => rematch());

  $("#btn-play-again").addEventListener("click", () => rematch());

  $("#btn-change-skin").addEventListener("click", () => {
    playClickSound();
    hideEndScreen();
    menuResult.hidden = true;
    showScreen("select");
    setWaitingClick(false);
  });

  btnMusic.addEventListener("click", () => {
    unlockAudio();
    toggleMusic();
    updateMusicButton();
  });

  updateScoreBars();
  updateMusicButton();
}

init();
