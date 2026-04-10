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
let rangeLow = MIN;
let rangeHigh = MAX;

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
const rangeText = document.getElementById('range-text');
const rangeBar = document.getElementById('range-bar');
const winIcon = document.getElementById('win-icon');
const winTitle = document.getElementById('win-title');
const winPraise = document.getElementById('win-praise');
const winRating = document.getElementById('win-rating');

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
function animateStatValue(el) {
  el.classList.remove('updated');
  // Force browser reflow/repaint to restart CSS animation by accessing offsetWidth
  void el.offsetWidth;
  el.classList.add('updated');
}

function renderStats(animate = false) {
  const stats = loadStats();

  statGames.textContent = stats.games;
  statTotal.textContent = stats.totalGuesses;
  statBest.textContent = stats.best !== null ? stats.best : '—';

  if (stats.games > 0) {
    statAvg.textContent = (stats.totalGuesses / stats.games).toFixed(1);
  } else {
    statAvg.textContent = '—';
  }

  if (animate) {
    [statGames, statTotal, statBest, statAvg].forEach(animateStatValue);
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

function updateRangeIndicator() {
  const totalSpan = MAX - MIN;
  const leftPct = ((rangeLow - MIN) / totalSpan) * 100;
  const widthPct = ((rangeHigh - rangeLow) / totalSpan) * 100;
  rangeBar.style.left = leftPct + '%';
  rangeBar.style.width = widthPct + '%';
  rangeText.textContent = rangeLow === rangeHigh
    ? `${rangeLow}`
    : `${rangeLow} ─ ${rangeHigh}`;
}

function triggerInputHint(type) {
  guessInput.classList.remove('hint-high', 'hint-low');
  if (type === 'high') guessInput.classList.add('hint-high');
  if (type === 'low') guessInput.classList.add('hint-low');
}

function triggerShake() {
  guessInput.classList.remove('shake');
  // Force browser reflow/repaint to restart CSS animation
  void guessInput.offsetWidth;
  guessInput.classList.add('shake');
  guessInput.addEventListener('animationend', () => {
    guessInput.classList.remove('shake');
  }, { once: true });
}

function triggerHintPop() {
  hintMessage.classList.remove('pop');
  void hintMessage.offsetWidth;
  hintMessage.classList.add('pop');
}

// === Score rating ===
function getWinPresentation(guesses) {
  if (guesses <= 5) {
    return {
      icon: '🏆',
      title: '太厲害了！',
      praise: '你是猜數字天才！',
      stars: '⭐⭐⭐⭐⭐',
    };
  } else if (guesses <= 8) {
    return {
      icon: '🎉',
      title: '表現優秀！',
      praise: '非常不錯的成績！',
      stars: '⭐⭐⭐⭐',
    };
  } else if (guesses <= 12) {
    return {
      icon: '😊',
      title: '恭喜猜對了！',
      praise: '不錯喔，繼續努力！',
      stars: '⭐⭐⭐',
    };
  } else if (guesses <= 18) {
    return {
      icon: '💪',
      title: '終於猜到了！',
      praise: '還有進步的空間，加油！',
      stars: '⭐⭐',
    };
  }
  return {
    icon: '🐢',
    title: '終於猜到了！',
    praise: '下次試試二分法策略！',
    stars: '⭐',
  };
}

// === 遊戲核心 ===
function startGame() {
  secretNumber = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  guessCount = 0;
  gameOver = false;
  currentGuesses = [];
  rangeLow = MIN;
  rangeHigh = MAX;

  guessInput.value = '';
  guessInput.disabled = false;
  guessInput.classList.remove('hint-high', 'hint-low', 'shake');
  submitBtn.disabled = false;
  errorMsg.textContent = '';
  hintArea.classList.add('hidden');
  hintMessage.textContent = '';
  hintMessage.className = 'hint-message';
  guessCountEl.textContent = '0';
  historyList.innerHTML = '';
  historyArea.classList.add('hidden');

  updateRangeIndicator();

  winSection.classList.add('hidden');
  winSection.classList.remove('section-fade-in');
  gameSection.classList.remove('hidden', 'section-fade-out');
  gameSection.classList.add('section-fade-in');

  guessInput.focus();
}

function handleGuess() {
  if (gameOver) return;

  const raw = guessInput.value.trim();

  // 輸入驗證
  if (raw === '') {
    errorMsg.textContent = '請輸入一個數字';
    triggerShake();
    return;
  }

  const num = Number(raw);

  if (!Number.isInteger(num)) {
    errorMsg.textContent = '請輸入整數';
    triggerShake();
    return;
  }

  if (num < MIN || num > MAX) {
    errorMsg.textContent = `請輸入 ${MIN} 到 ${MAX} 之間的數字`;
    triggerShake();
    return;
  }

  errorMsg.textContent = '';
  guessCount += 1;
  guessCountEl.textContent = guessCount;
  hintArea.classList.remove('hidden');
  historyArea.classList.remove('hidden');

  if (num > secretNumber) {
    hintMessage.textContent = '大了！數字太大 ↑';
    hintMessage.className = 'hint-message too-high';
    addHistoryItem(num, 'too-high');
    triggerHintPop();
    triggerInputHint('high');
    rangeHigh = Math.min(rangeHigh, num - 1);
    updateRangeIndicator();
  } else if (num < secretNumber) {
    hintMessage.textContent = '小了！數字太小 ↓';
    hintMessage.className = 'hint-message too-low';
    addHistoryItem(num, 'too-low');
    triggerHintPop();
    triggerInputHint('low');
    rangeLow = Math.max(rangeLow, num + 1);
    updateRangeIndicator();
  } else {
    hintMessage.textContent = '🎉 猜對了！';
    hintMessage.className = 'hint-message correct';
    addHistoryItem(num, 'correct');
    triggerHintPop();
    guessInput.classList.remove('hint-high', 'hint-low');
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

  recordResult(guessCount);
  renderStats(true);

  // 顯示勝利畫面
  const pres = getWinPresentation(guessCount);

  setTimeout(() => {
    answerDisplay.textContent = secretNumber;
    finalCount.textContent = guessCount;
    winIcon.textContent = pres.icon;
    winTitle.textContent = pres.title;
    winPraise.textContent = pres.praise;
    winRating.textContent = pres.stars;

    gameSection.classList.add('section-fade-out');

    setTimeout(() => {
      gameSection.classList.add('hidden');
      gameSection.classList.remove('section-fade-out');
      winSection.classList.remove('hidden');
      winSection.classList.add('section-fade-in');
    }, 300);
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
