// 🎮 Tic Tac Toe Game Script: Handles logic, UI, sounds, animations
document.addEventListener('DOMContentLoaded', () => {
  const cells = document.querySelectorAll('.cell');
  const statusText = document.getElementById('status');
  const resetBtn = document.getElementById('resetBtn');
  const resetScoreBtn = document.getElementById('resetScoreBtn');
  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');
  const difficultySelect = document.getElementById('difficulty');
  const modeSelect = document.getElementById('gameMode');
  const playerSymbolSelect = document.getElementById('playerSymbol');
  const themeToggle = document.getElementById('themeToggle');
  const muteToggle = document.getElementById('muteToggle');
  const winLine = document.getElementById('line');
  const timerDisplay = document.getElementById('timerDisplay');

  const moveSound = new Audio('sfx/move.mp3');
  const winSound = new Audio('sfx/victory.mp3');
  const defeatSound = new Audio('sfx/lose.mp3');

  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let playerChar = 'X';
  let aiChar = 'O';
  let playerScore = 0;
  let computerScore = 0;
  let gameOver = false;
  let timer = null;
  let elapsedSeconds = 0;
  let hintUsed = false;

  const emoji = { X: '✖️', O: '⭕' };

  const winCombos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  const winLineCoords = [
    [15, 50, 285, 50], [15, 150, 285, 150], [15, 250, 285, 250],
    [50, 15, 50, 285], [150, 15, 150, 285], [250, 15, 250, 285],
    [15, 15, 285, 285], [15, 285, 285, 15]
  ];

  function playSound(audio) {
    if (muteToggle.dataset.muted === 'true') return;
    audio.currentTime = 0;
    audio.play();
  }

  function updateStatus(msg) {
    statusText.textContent = msg;
  }

  function showWinLine(index) {
    const [x1, y1, x2, y2] = winLineCoords[index];
    winLine.setAttribute('x1', x1);
    winLine.setAttribute('y1', y1);
    winLine.setAttribute('x2', x2);
    winLine.setAttribute('y2', y2);
  }

  function hideWinLine() {
    winLine.setAttribute('x1', 0);
    winLine.setAttribute('y1', 0);
    winLine.setAttribute('x2', 0);
    winLine.setAttribute('y2', 0);
  }

  function confettiWin() {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 }
    });
  }

  function checkWin(player) {
    return winCombos.findIndex(([a, b, c]) =>
      board[a] === player && board[b] === player && board[c] === player
    );
  }

  function checkDraw() {
    return board.every(cell => cell !== '');
  }

  function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.innerHTML = emoji[player];
    cell.removeAttribute('data-hint');
    playSound(moveSound);

    const winIndex = checkWin(player);
    if (winIndex !== -1) {
      gameOver = true;
      showWinLine(winIndex);
      updateStatus(`${emoji[player]} wins!`);
      playSound(player === playerChar ? winSound : defeatSound);
      if (player === playerChar) playerScore++;
      else computerScore++;
      updateScores();
      stopTimer();
      if (player === playerChar) confettiWin();
    } else if (checkDraw()) {
      updateStatus("It's a draw!");
      gameOver = true;
      stopTimer();
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateStatus(`${getCurrentPlayerLabel()}'s turn`);
      if (!gameOver && isAI() && currentPlayer === aiChar) {
        setTimeout(() => {
          const move = getAIMove();
          makeMove(move, aiChar);
        }, 400);
      }
    }
  }

  function isAI() {
    return modeSelect.value === 'ai';
  }

  function getCurrentPlayerLabel() {
    if (!isAI()) return `Player ${emoji[currentPlayer]}`;
    return currentPlayer === playerChar ? `Player ${emoji[playerChar]}` : 'Computer';
  }

  function handleClick(e) {
    const index = e.target.dataset.index;
    if (board[index] || gameOver || (isAI() && currentPlayer === aiChar)) return;
    makeMove(index, currentPlayer);
  }

  function getAIMove() {
    const difficulty = difficultySelect.value;
    const available = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
    if (difficulty === 'easy') return random(available);
    if (difficulty === 'medium') return Math.random() < 0.5 ? random(available) : minimax(board, aiChar).index;
    return minimax(board, aiChar).index;
  }

  function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function minimax(newBoard, player) {
    const avail = newBoard.map((v, i) => v === '' ? i : null).filter(i => i !== null);
    const opponent = player === 'O' ? 'X' : 'O';

    if (checkWinSim(newBoard, playerChar)) return { score: -10 };
    if (checkWinSim(newBoard, aiChar)) return { score: 10 };
    if (avail.length === 0) return { score: 0 };

    return avail.map(i => {
      newBoard[i] = player;
      const result = minimax(newBoard, opponent);
      newBoard[i] = '';
      return { index: i, score: result.score };
    }).reduce((a, b) => (player === aiChar ? (a.score > b.score ? a : b) : (a.score < b.score ? a : b)));
  }

  function checkWinSim(boardSim, player) {
    return winCombos.some(([a, b, c]) =>
      boardSim[a] === player && boardSim[b] === player && boardSim[c] === player
    );
  }

  function updateScores() {
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
  }

  function resetGame() {
    board.fill('');
    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.removeAttribute('data-hint');
    });
    playerChar = playerSymbolSelect.value;
    aiChar = playerChar === 'X' ? 'O' : 'X';
    currentPlayer = 'X';
    gameOver = false;
    hintUsed = false;
    hideWinLine();
    updateStatus(`${getCurrentPlayerLabel()}'s turn`);
    resetTimer();
    startTimer();
    if (isAI() && currentPlayer === aiChar) {
      setTimeout(() => {
        const move = getAIMove();
        makeMove(move, aiChar);
      }, 400);
    } else if (isAI()) {
      previewAIHint();
    }
  }

  function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timer = setInterval(() => {
      elapsedSeconds++;
      const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const s = String(elapsedSeconds % 60).padStart(2, '0');
      timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
  }

  function resetTimer() {
    stopTimer();
    timerDisplay.textContent = '00:00';
  }

  function previewAIHint() {
    if (!isAI() || gameOver) return;
    const diff = difficultySelect.value;
    if (diff === 'hard') return;
    if (diff === 'medium' && hintUsed) return;
    const aiMove = getAIMove();
    if (aiMove !== null && board[aiMove] === '') {
      cells.forEach(cell => cell.removeAttribute('data-hint'));
      cells[aiMove].setAttribute('data-hint', emoji[aiChar]);
      if (diff === 'medium') hintUsed = true;
    }
  }

  function toggleMute() {
    const muted = muteToggle.dataset.muted === 'true';
    muteToggle.dataset.muted = muted ? 'false' : 'true';
    muteToggle.textContent = muted ? '🔊' : '🔇';
  }

// 🐱 Dynamically add bugcats that float in to the right
// 🐱 Adds bugcat GIFs that float in to the right with randomized properties
function placeBugcats() {
  const container = document.getElementById('bugcats-container');
  container.innerHTML = ''; // Clear old bugcats on re-call

  for (let i = 1; i <= 15; i++) {
    const img = document.createElement('img');
    img.src = `bugcat/bugcat${i}.gif`;
    img.classList.add('bugcat');
    img.style.left = Math.random() * 100 + 'vw';
    img.style.top = `${-200 - Math.random() * 100}px`;
    img.style.animationDuration = (10 + Math.random() * 10).toFixed(1) + 's';
    img.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
    img.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    img.onerror = () => img.style.display = 'none';
    container.appendChild(img);
  }
}

  // ✅ Enable gameplay and UI event listeners
  cells.forEach(cell => cell.addEventListener('click', handleClick));
  resetBtn.addEventListener('click', resetGame);
  resetScoreBtn.addEventListener('click', () => {
    playerScore = 0;
    computerScore = 0;
    updateScores();
  });
  themeToggle.addEventListener('change', () => applyTheme(themeToggle.value));
  modeSelect.addEventListener('change', resetGame);
  difficultySelect.addEventListener('change', previewAIHint);
  playerSymbolSelect.addEventListener('change', resetGame);
  muteToggle.addEventListener('click', toggleMute);

  // 🌗 Apply current theme
  applyTheme(themeToggle.value);

  // ⏱️ Start game status
  updateStatus(`Player ${emoji[currentPlayer]}'s turn`);
  resetTimer();
  startTimer();
  placeBugcats();


// 🌗 Theme toggle logic: applies dark mode if selected
function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
}

});