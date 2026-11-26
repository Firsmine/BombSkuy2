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

let username = "";
let difficulty = "easy";
let countInterval;
let timerInterval;
let score = 0;

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
  username = usernameInput.value.trim();
  difficulty = difficultyInput.value;
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
}
