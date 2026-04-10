/**
 * 猜數字遊戲 - 遊戲邏輯
 * 功能：隨機生成 1-100 整數、提示大/小、追蹤次數、LocalStorage 統計
 */

const STORAGE_KEY = 'guessNumber_stats';
const MIN = 1;
const MAX = 100;
const MAX_TREND = 10; // 最近幾局顯示趨勢

// === 遊戲狀態 ===
let secretNumber = 0;
let guessCount = 0;
let gameOver = false;
let currentGuesses = []; // 本局猜測記錄

// === DOM 元素 ===
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const errorMsg = document.getElementById('error-msg');
const hintArea = document.getElementById('hint-area');
const hintMessage = document.getElementById('hint-message');
const guessCountEl = document.getElementById('guess-count');
const historyArea = document.getElementById('history-area');
const historyList = document.getElementById('history-list');
const gameSection = document.getElementById('game-section');
const winSection = document.getElementById('win-section');
const answerDisplay = document.getElementById('answer-display');
const finalCount = document.getElementById('final-count');
const newGameBtn = document.getElementById('new-game-btn');
const resetBtn = document.getElementById('reset-btn');

const statGames = document.getElementById('stat-games');
const statBest = document.getElementById('stat-best');
const statAvg = document.getElementById('stat-avg');
const statTotal = document.getElementById('stat-total');
const trendArea = document.getElementById('trend-area');
const trendChart = document.getElementById('trend-chart');

// === 統計資料操作 ===
function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    // ignore parse errors
  }
  return { games: 0, best: null, totalGuesses: 0, history: [] };
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function recordResult(guesses) {
  const stats = loadStats();
  stats.games += 1;
  stats.totalGuesses += guesses;
  if (stats.best === null || guesses < stats.best) {
    stats.best = guesses;
  }
  stats.history.push(guesses);
  saveStats(stats);
  return stats;
}

function clearStats() {
  localStorage.removeItem(STORAGE_KEY);
}

// === UI 更新 ===
function renderStats() {
  const stats = loadStats();
  statGames.textContent = stats.games;
  statTotal.textContent = stats.totalGuesses;
  statBest.textContent = stats.best !== null ? stats.best : '—';

  if (stats.games > 0) {
    statAvg.textContent = (stats.totalGuesses / stats.games).toFixed(1);
  } else {
    statAvg.textContent = '—';
  }

  renderTrend(stats.history);
}

function renderTrend(history) {
  if (history.length === 0) {
    trendArea.classList.add('hidden');
    return;
  }

  trendArea.classList.remove('hidden');
  const recent = history.slice(-MAX_TREND);
  const maxVal = Math.max(...recent);
  const minVal = Math.min(...recent);
  const bestIndex = recent.indexOf(minVal);

  trendChart.innerHTML = '';

  recent.forEach((val, i) => {
    const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 50;
    const wrap = document.createElement('div');
    wrap.className = 'trend-bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'trend-bar' + (i === bestIndex ? ' best' : '');
    bar.style.height = heightPct + '%';
    bar.title = `第 ${history.length - recent.length + i + 1} 局：${val} 次`;

    const label = document.createElement('div');
    label.className = 'trend-label';
    label.textContent = val;

    wrap.appendChild(bar);
    wrap.appendChild(label);
    trendChart.appendChild(wrap);
  });
}

function addHistoryItem(number, result) {
  const li = document.createElement('li');
  li.className = result;
  const icon = result === 'too-high' ? '↑' : result === 'too-low' ? '↓' : '✓';
  li.textContent = `${icon} ${number}`;
  historyList.appendChild(li);
}

// === 遊戲核心 ===
function startGame() {
  secretNumber = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  guessCount = 0;
  gameOver = false;
  currentGuesses = [];

  guessInput.value = '';
  guessInput.disabled = false;
  submitBtn.disabled = false;
  errorMsg.textContent = '';
  hintArea.classList.add('hidden');
  hintMessage.textContent = '';
  hintMessage.className = 'hint-message';
  guessCountEl.textContent = '0';
  historyList.innerHTML = '';
  historyArea.classList.add('hidden');

  winSection.classList.add('hidden');
  gameSection.classList.remove('hidden');

  guessInput.focus();
}

function handleGuess() {
  if (gameOver) return;

  const raw = guessInput.value.trim();

  // 輸入驗證
  if (raw === '') {
    errorMsg.textContent = '請輸入一個數字';
    return;
  }

  const num = Number(raw);

  if (!Number.isInteger(num)) {
    errorMsg.textContent = '請輸入整數';
    return;
  }

  if (num < MIN || num > MAX) {
    errorMsg.textContent = `請輸入 ${MIN} 到 ${MAX} 之間的數字`;
    return;
  }

  errorMsg.textContent = '';
  guessCount += 1;
  guessCountEl.textContent = guessCount;
  hintArea.classList.remove('hidden');
  historyArea.classList.remove('hidden');

  if (num > secretNumber) {
    hintMessage.textContent = '大了！數字太大';
    hintMessage.className = 'hint-message too-high';
    addHistoryItem(num, 'too-high');
  } else if (num < secretNumber) {
    hintMessage.textContent = '小了！數字太小';
    hintMessage.className = 'hint-message too-low';
    addHistoryItem(num, 'too-low');
  } else {
    hintMessage.textContent = '🎉 猜對了！';
    hintMessage.className = 'hint-message correct';
    addHistoryItem(num, 'correct');
    endGame();
    return;
  }

  guessInput.value = '';
  guessInput.focus();
}

function endGame() {
  gameOver = true;
  guessInput.disabled = true;
  submitBtn.disabled = true;

  const stats = recordResult(guessCount);
  renderStats();

  // 顯示勝利畫面
  setTimeout(() => {
    answerDisplay.textContent = secretNumber;
    finalCount.textContent = guessCount;
    gameSection.classList.add('hidden');
    winSection.classList.remove('hidden');
  }, 600);
}

// === 事件綁定 ===
submitBtn.addEventListener('click', handleGuess);

guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleGuess();
});

newGameBtn.addEventListener('click', startGame);

resetBtn.addEventListener('click', () => {
  if (confirm('確定要清除所有歷史記錄嗎？')) {
    clearStats();
    renderStats();
  }
});

// === 初始化 ===
renderStats();
startGame();
