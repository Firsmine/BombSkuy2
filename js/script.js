const instructionModal = document.getElementById("instructionModal");
const countdownModal = document.getElementById("countdownModal");
const countdownDisplay = document.getElementById("countdown");
const btnInstruction = document.getElementById("btnInstruction");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const btnClose = document.getElementById("btnClose");
const btnStart = document.getElementById("btnStart");
const usernameInput = document.getElementById("usernameInput");
const difficultyInput = document.getElementById("difficultyInput");
const gameOverModal = document.getElementById("gameOverModal");

let countdown;
let countInterval;
let timerInterval;
const gameState = {
  username: "",
  difficulty: "easy",
  isPlaying: false,
  isPaused: false,
  player: {
    x: 1,
    y: 1,
    lives: 3,
    range: 1,
    isFrozen: false,
    isBlinking: false,
    direction: "down",
  },
  timer: 0,
  scores: {
    walls: 0,
    tnt: 0,
    ice: 0,
  },
  grid: [],
  dogs: [],
  bombs: [],
  items: [],
  explosions: [],
};

function formatTime(secondsTotal) {
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  const displayMinutes = minutes.toString().padStart(2, "0");
  const displaySeconds = seconds.toString().padStart(2, "0");
  return `${displayMinutes}:${displaySeconds}`;
}
function saveScore() {
  const history = JSON.parse(localStorage.getItem("bombskuy_history")) || [];
  history.push({
    username: gameState.username,
    time: formatTime(gameState.timer),
    walls: gameState.scores.walls,
    tnt: gameState.scores.tnt,
    ice: gameState.scores.ice,
  });
  localStorage.setItem("bombskuy_history", JSON.stringify(history));
}

btnInstruction.addEventListener("click", function () {
  instructionModal.style.display = "flex";
});
btnClose.addEventListener("click", function () {
  instructionModal.style.display = " none";
});

btnStart.disabled = true;
usernameInput.addEventListener("input", function () {
  btnStart.disabled = usernameInput.value.trim() === "";
});
btnStart.addEventListener("click", function () {
  if (usernameInput.value.trim() === "") {
    alert("Enter your name first!");
    return;
  }
  gameState.username = usernameInput.value.trim();
  gameState.difficulty = difficultyInput.value;
  btnStart.disabled = true;
  showCountdown();
});

function showCountdown() {
  countdownModal.style.display = "flex";
  countdown = 3;
  clearInterval(countInterval);
  countInterval = setInterval(() => {
    countdown--;
    countdownDisplay.innerText = countdown;
    if (countdown === 0) {
      clearInterval(countInterval);
      loadGame();
    }
  }, 1000);
}
function loadGame() {
  countdownModal.style.display = "none";
  gameScreen.style.display = "flex";
  gameState.timer = 0;
  gameState.scores = {
    walls: 0,
    tnt: 0,
    ice: 0,
  };
  gameState.bombs = [];
  gameState.items = [];
  gameState.explosions = [];
  initBoard();
  initPlayer();
  initDogs();
  gameState.isPlaying = true;
  gameState.isPaused = false;
  startTimer();
  renderGraphics();
  requestAnimationFrame(gameLoop);
}
function gameLoop() {
  if (!gameState.isPlaying) return;
  if (!gameState.isPaused) {
    updateGameLogic();
    renderGraphics();
  }
  if (gameState.player.lives <= 0) {
    handleGameOver();
    return;
  }
  if (gameState.dogs.length <= 0) {
    handleWin();
    return;
  }
  requestAnimationFrame(gameLoop);
}
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameState.timer++;
      updateHUD();
    }
  }, 1000);
}
function updateHUD() {
  const min = String(Math.floor(gameState.timer / 60)).padStart(2, "0");
  const sec = String(gameState.timer % 60).padStart(2, "0");

  document.getElementById("nameHUD").innerText = gameState.username;
  document.getElementById("timeHUD").innerText = `${min}:${sec}`;
  document.getElementById("wallsHUD").innerText = gameState.scores.walls;
  document.getElementById("tntHUD").innerText = gameState.scores.tnt;
  document.getElementById("iceHUD").innerText = gameState.scores.ice;

  const livesDiv = document.getElementById("livesHUD");
  if (livesDiv) {
    livesDiv.innerHTML = "";
    for (let i = 0; i < gameState.player.lives; i++) {
      livesDiv.innerHTML += `<img src="assets/heart.png" style="width:20px;">`;
    }
  }
}

const pauseModal = document.getElementById("pauseModal");
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && gameState.isPlaying) {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
      pauseModal.classList.remove("hidden");
    } else {
      countdownContinue();
    }
  }
  if (
    !gameState.isPaused &&
    gameState.isPlaying &&
    !gameState.player.isFrozen
  ) {
    handlePlayerMovement(e.key);
  }
});
const btnContinue = document.getElementById("btnContinue");
btnContinue.addEventListener("click", function () {
  countdownContinue();
});
function countdownContinue() {
  pauseModal.classList.add("hidden");
  countdownModal.style.display = "flex";
  countdown = 3;
  countdownDisplay.innerText = countdown;
  clearInterval(countInterval);
  countInterval = setInterval(() => {
    countdown--;
    countdownDisplay.innerText = countdown;
    if (countdown === 0) {
      clearInterval(countInterval);
      countdownModal.style.display = "none";
      gameState.isPaused = false;
    }
  }, 1000);
}

function updateGameLogic() {
  updateDogs();
  const now = Date.now();
  gameState.explosions = gameState.explosions.filter(
    (ex) => now - ex.timeCreated < 500,
  );
}
// board
const cols = 11;
const rows = 9;
const tile_size = 68;
const map_layout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
function initBoard() {
  gameState.grid = [];
  for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
      let cell = map_layout[y][x];
      if (cell === 0) {
        if (
          (x === 1 && y === 1) ||
          (x === 2 && y === 1) ||
          (x === 1 && y === 2)
        ) {
          row.push(0);
        } else {
          row.push(Math.random() <= 0.4 ? 2 : 0);
        }
      } else {
        row.push(cell);
      }
    }
    gameState.grid.push(row);
  }
}

// player
function initPlayer() {
  gameState.player = {
    x: 1,
    y: 1,
    lives: 3,
    range: 1,
    isFrozen: false,
    direction: "down",
    hasItemMark: null,
  };
  updateHUD();
}
function handlePlayerMovement(key) {
  let newX = gameState.player.x;
  let newY = gameState.player.y;
  if (key === "a" || key === "ArrowLeft") {
    newX--;
    gameState.player.direction = "left";
  }
  if (key === "s" || key === "ArrowDown") {
    newY++;
    gameState.player.direction = "down";
  }
  if (key === "w" || key === "ArrowUp") {
    newY--;
    gameState.player.direction = "up";
  }
  if (key === "d" || key === "ArrowRight") {
    newX++;
    gameState.player.direction = "right";
  }
  if (key === " ") {
    placeBomb();
    return;
  }
  if (
    newY >= 0 &&
    newY < rows &&
    newX >= 0 &&
    newX < cols &&
    gameState.grid[newY][newX] === 0
  ) {
    gameState.player.x = newX;
    gameState.player.y = newY;
    checkItemCollision();
  }
}

function playerHit() {
  gameState.player.lives -= 1;
  gameState.player.isBlinking = true;
  let blinkCount = 0;
  const blinkInterval = setInterval(() => {
    gameState.player.isBlinking = !gameState.player.isBlinking;
    blinkCount++;
    if (blinkCount >= 5) {
      clearInterval(blinkInterval);
      gameState.player.isBlinking = false;
    }
  }, 200);
  updateHUD();
  return;
}

// enemies
function initDogs() {
  gameState.dogs = [];
  let dogCount = 1;
  if (gameState.difficulty === "medium") dogCount = 2;
  if (gameState.difficulty === "hard") dogCount = 3;

  while (gameState.dogs.length < dogCount) {
    let x = Math.floor(Math.random() * (cols - 2)) + 1;
    let y = Math.floor(Math.random() * (rows - 2)) + 1;
    let distance =
      Math.abs(x - gameState.player.x) + Math.abs(y - gameState.player.y);
    if (gameState.grid[y][x] === 0 && distance >= 6) {
      gameState.dogs.push({
        x: x,
        y: y,
        lastMove: Date.now(),
      });
    }
  }
}
function updateDogs() {
  const now = Date.now();
  gameState.dogs.forEach(function (dog) {
    if (now - dog.lastMove < 800) return;
    let px = gameState.player.x;
    let py = gameState.player.y;

    if (dog.x < px) {
      if (gameState.grid[dog.y][dog.x + 1] === 0) dog.x++;
    } else if (dog.x > px) {
      if (gameState.grid[dog.y][dog.x - 1] === 0) dog.x--;
    }
    if (dog.y < py) {
      if (gameState.grid[dog.y + 1][dog.x] === 0) dog.y++;
    } else if (dog.y > py) {
      if (gameState.grid[dog.y - 1][dog.x] === 0) dog.y--;
    }
    dog.lastMove = now;
    if (dog.x === px && dog.y === py) {
      playerHit();
    }
  });
}

// bomb
function placeBomb() {
  const existingBomb = gameState.bombs.find(
    (b) => b.x === gameState.player.x && b.y === gameState.player.y,
  );
  if (existingBomb) return;
  const newBomb = {
    x: gameState.player.x,
    y: gameState.player.y,
    range: gameState.player.range,
    timer: 5000,
  };
  gameState.bombs.push(newBomb);
  setTimeout(() => {
    explodeBomb(newBomb);
  }, 5000);
}
function explodeBomb(bomb) {
  gameState.bombs = gameState.bombs.filter((b) => b !== bomb);
  const range = bomb.range;
  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  const explosionCoords = [{ x: bomb.x, y: bomb.y }];
  checkExplosionDamage(bomb.x, bomb.y);

  directions.forEach((dir) => {
    for (let i = 1; i <= range; i++) {
      let exX = bomb.x + dir[0] * i;
      let exY = bomb.y + dir[1] * i;
      if (gameState.grid[exY][exX] === 1) break;
      explosionCoords.push({ x: exX, y: exY });
      checkExplosionDamage(exX, exY);
      if (gameState.grid[exY][exX] === 2) {
        gameState.grid[exY][exX] = 0;
        gameState.scores.walls += 1;
        spawnItem(exX, exY);
        break;
      }
    }
  });
  gameState.explosions.push({
    coords: explosionCoords,
    timeCreated: Date.now(),
  });
  updateHUD();
}
function checkExplosionDamage(x, y) {
  if (gameState.player.x === x && gameState.player.y === y) {
    playerHit();
  }
  gameState.dogs = gameState.dogs.filter((dog) => {
    if (dog.x === x && dog.y === y) {
      gameState.scores.walls += 5;
      return false;
    }
    return true;
  });
}

// items
function spawnItem(x, y) {
  if (Math.random() > 0.7) {
    const types = ["tnt", "ice", "heart"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    gameState.items.push({ x: x, y: y, type: randomType });
  }
}
function checkItemCollision() {
  const itemIndex = gameState.items.findIndex(
    (item) => item.x === gameState.player.x && item.y === gameState.player.y,
  );
  if (itemIndex > -1) {
    const item = gameState.items[itemIndex];
    if (item.type === "heart") {
      playerHit();
    } else if (item.type === "tnt") {
      gameState.player.range *= 2;
      gameState.scores.tnt += 1;
    } else if (item.type === "ice") {
      gameState.player.isFrozen = true;
      gameState.scores.ice += 1;
      setTimeout(() => {
        gameState.player.isFrozen = false;
      }, 5000);
    }
    gameState.player.hasItemMark = item.type;
    setTimeout(() => (gameState.player.hasItemMark = null), 3000);
    gameState.items.splice(itemIndex, 1);
    updateHUD();
  }
}

// render
function renderGraphics() {
  const mapArea = document.getElementById("gameBoard");
  mapArea.innerHTML = "";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (gameState.grid[y][x] !== 0) {
        let div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = x * tile_size + "px";
        div.style.top = y * tile_size + "px";
        div.style.width = tile_size + "px";
        div.style.height = tile_size + "px";
        div.style.backgroundImage =
          gameState.grid[y][x] === 2 ? "url('assets/wall.png')" : "none";
        div.style.backgroundSize = "cover";
        mapArea.appendChild(div);
      }
    }
  }

  gameState.items.forEach((item) => {
    let div = document.createElement("img");
    div.src = `assets/${item.type}.png`;
    div.style.position = "absolute";
    div.style.left = item.x * tile_size + "px";
    div.style.top = item.y * tile_size + "px";
    div.style.width = tile_size + "px";
    div.style.height = tile_size + "px";
    mapArea.appendChild(div);
  });

  gameState.bombs.forEach((bomb) => {
    let div = document.createElement("img");
    div.src = `assets/bomb.png`;
    div.style.position = "absolute";
    div.style.left = bomb.x * tile_size + "px";
    div.style.top = bomb.y * tile_size + "px";
    div.style.width = tile_size + "px";
    div.style.height = tile_size + "px";
    mapArea.appendChild(div);
  });
  gameState.explosions.forEach((explosion) => {
    explosion.coords.forEach((coord) => {
      let explosionDiv = document.createElement("img");
      explosionDiv.src = `/assets/explosion.png`;
      explosionDiv.style.position = "absolute";
      explosionDiv.style.left = coord.x * tile_size + "px";
      explosionDiv.style.top = coord.y * tile_size + "px";
      explosionDiv.style.width = tile_size + "px";
      explosionDiv.style.height = tile_size + "px";
      mapArea.appendChild(explosionDiv);
    });
  });

  gameState.dogs.forEach((dog) => {
    let div = document.createElement("img");
    div.src = `assets/dog_down.png`;
    div.style.position = "absolute";
    div.style.left = dog.x * tile_size + "px";
    div.style.top = dog.y * tile_size + "px";
    div.style.width = tile_size + "px";
    div.style.height = tile_size + "px";
    mapArea.appendChild(div);
  });

  let playerDiv = document.createElement("img");
  playerDiv.src = `assets/char_${gameState.player.direction}.png`;
  playerDiv.style.position = "absolute";
  playerDiv.style.left = gameState.player.x * tile_size + "px";
  playerDiv.style.top = gameState.player.y * tile_size + "px";
  playerDiv.style.width = tile_size + "px";
  playerDiv.style.height = tile_size + "px";
  if (gameState.player.isFrozen) {
    playerDiv.style.filter =
      "brightness(50%) sepia(1) hue-rotate(180deg) saturate(3)";
  }
  if (gameState.player.isBlinking) {
    playerDiv.style.visibility = "hidden";
  }
  mapArea.appendChild(playerDiv);
}

function handleGameOver() {
  gameState.isPlaying = false;
  gameOverModal.style.display = "flex";
  btnSaveScore.disabled = false;
  const title = document.getElementById("goTitle");
  title.innerText = "Game Over!";
  updateGameOverInfo();
}
function handleWin() {
  gameState.isPlaying = false;
  gameOverModal.style.display = "flex";
  const title = document.getElementById("goTitle");
  title.innerText = "You Win!";
  updateGameOverInfo();
}
function updateGameOverInfo() {
  const formattedTime = formatTime(gameState.timer);
  document.getElementById("goUsername").innerText = gameState.username;
  document.getElementById("goTimer").innerText = formattedTime;
  document.getElementById("goWalls").innerText = gameState.scores.walls;
  document.getElementById("goTnt").innerText = gameState.scores.tnt;
  document.getElementById("goIce").innerText = gameState.scores.ice;
}

// leaderboard
function renderLeaderboardTable() {
  let leaderboardData =
    JSON.parse(localStorage.getItem("bombskuy_history")) || [];
  leaderboardData.sort((a, b) => {
    if (b.walls !== a.walls) {
      return b.walls - a.walls;
    }
    if (b.tnt !== a.tnt) {
      return b.tnt - a.tnt;
    }
    if (b.ice !== a.ice) {
      return b.ice - a.ice;
    }
  });
  const tableBody = document.getElementById("leaderboardData");
  tableBody.innerHTML = "";
  leaderboardData.forEach((player, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>#${index + 1}</td>
            <td>${player.username}</td>
            <td>${player.time}</td>
            <td>${player.walls}</td>
            <td>${player.tnt}</td>
            <td>${player.ice}</td>
        `;
    tableBody.appendChild(row);
  });
}

const btnSaveScore = document.getElementById("btnSave");
const btnGoLeaderboard = document.getElementById("btnLeaderboards");
const leaderboardModal = document.getElementById("leaderboardModal");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const btnReset = document.getElementById("btnReset");

btnSaveScore.addEventListener("click", function () {
  saveScore();
  btnSaveScore.disabled = true;
  alert("Score successfully saved!");
});
btnGoLeaderboard.addEventListener("click", function () {
  gameOverModal.style.display = "none";
  renderLeaderboardTable();
  leaderboardModal.style.display = "flex";
});
btnPlayAgain.addEventListener("click", function () {
  gameState.username = usernameInput.value;
  gameState.difficulty = difficultyInput.value;
  leaderboardModal.style.display = "none";
  gameState.timer = 0;
  gameState.scores = {
    walls: 0,
    tnt: 0,
    ice: 0,
  };
  gameState.bombs = [];
  gameState.items = [];
  gameState.explosions = [];
  showCountdown();
});
btnReset.addEventListener("click", function () {
  homeScreen.style.display = "flex";
  gameScreen.style.display = "none";
  leaderboardModal.style.display = "none";
});
