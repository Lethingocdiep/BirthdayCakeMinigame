// ====== HỆ THỐNG ÂM THANH ======
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type, duration, vol = 0.1) {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

// Cập nhật thêm tiếng ăn và tiếng cắt bánh
const sounds = {
  mix: () => playTone(300, 'square', 0.1, 0.05),
  pour: () => playTone(400, 'sine', 0.3, 0.1),
  bake: () => playTone(150, 'triangle', 0.5, 0.1),
  sparkle: () => {
    playTone(800, 'sine', 0.2, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.3, 0.1), 100);
    setTimeout(() => playTone(1600, 'sine', 0.4, 0.1), 200);
  },
  blow: () => playTone(100, 'sawtooth', 0.8, 0.1),
  cut: () => playTone(800, 'sawtooth', 0.1, 0.1),
  eat: () => playTone(600, 'sine', 0.2, 0.1)
};

// ====== DỮ LIỆU CÁC BƯỚC GAME ======
const steps = [
  { id: "mix", text: "Bước 1: Đánh bột thật đều tay!", main: "tools/bowl.png", items: ["tools/whisk.png"], btn: "Khuấy bột", action: "progress" },
  { id: "pour", text: "Bước 2: Đổ bột vào khuôn", main: "tools/mold.png", items: ["tools/bowl.png"], btn: "Đổ bột", action: "click" },
  { id: "bake", text: "Bước 3: Nướng bánh trong lò", main: "oven/oven.png", items: [], btn: "Nướng bánh", action: "progress_auto" },
  { id: "cream", text: "Bước 4: Làm kem Matcha", main: "tools/bowl_cream.png", items: ["ingredients/matcha.png", "ingredients/cream.png"], btn: "Trộn kem", action: "progress" },
  { id: "frost", text: "Bước 5: Phết kem lên bánh", main: "cake/bare_cake.png", items: ["tools/spatula.png"], btn: "Phết kem", action: "click" },
  { id: "decor", text: "Bước 6: Trang trí bánh", main: "cake/frosted.png", items: ["decor/topping.png", "decor/candle.png"], btn: "Trang trí", action: "click" },
  { id: "blow", text: "Hoàn thành! Hãy thổi nến nào!", main: "cake/full.png", items: [], btn: "Thổi nến 🌬️", action: "blow" },
  { id: "cut", text: "Cắt một lát bánh nhỏ", main: "cake/full.png", items: ["tools/knife.png"], btn: "Cắt bánh", action: "cut" },
  { id: "feed", text: "Aaa... Đút cho nhau ăn nào!", main: "cake/slice.png", items: [], btn: "Đút ăn ❤️", action: "feeding" }
];

let currentStep = 0;
let progress = 0;

// Các phần tử DOM
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("start-screen");
const gameUI = document.getElementById("game-ui");
const bg = document.getElementById("bg");

const statusText = document.getElementById("status-text");
const workspace = document.getElementById("workspace");
const tray = document.getElementById("tray");
const actionBtn = document.getElementById("actionBtn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

// Xử lý sự kiện khi bấm nút Start
startBtn.onclick = () => {
  initAudio();
  sounds.sparkle();
  
  startScreen.style.display = "none";
  gameUI.style.display = "flex";
  bg.classList.add("dimmed");
  
  loadStep();
};

function loadStep() {
  progress = 0;
  const stepData = steps[currentStep];
  
  statusText.innerHTML = stepData.text;
  actionBtn.innerText = stepData.btn;
  actionBtn.style.display = "inline-block";
  progressContainer.style.display = "none";
  progressBar.style.width = "0%";
  tray.innerHTML = "";

  if (stepData.main) {
    workspace.innerHTML = `<img src="images/${stepData.main}" style="width:200px; transition: 0.3s;" id="main-item">`;
  }

  if (stepData.items) {
    stepData.items.forEach(i => {
      const img = document.createElement("img");
      img.src = "images/" + i;
      tray.appendChild(img);
    });
  }
}

// Xử lý các thao tác trong game
actionBtn.onclick = () => {
  const stepData = steps[currentStep];

  if (stepData.action === "progress") {
    progressContainer.style.display = "block";
    progress += 20;
    progressBar.style.width = progress + "%";
    sounds.mix();
    if (progress >= 100) setTimeout(nextStep, 500);

  } else if (stepData.action === "click") {
    sounds.pour();
    let mainImg = document.getElementById("main-item");
    mainImg.style.transform = "scale(1.1) rotate(5deg)";
    setTimeout(nextStep, 600);

  } else if (stepData.action === "progress_auto") {
    actionBtn.style.display = "none";
    progressContainer.style.display = "block";
    
    let bakeInterval = setInterval(() => {
      progress += 10;
      progressBar.style.width = progress + "%";
      sounds.bake();
      
      if (progress >= 100) {
        clearInterval(bakeInterval);
        sounds.sparkle();
        setTimeout(nextStep, 800);
      }
    }, 300);

  } else if (stepData.action === "blow") {
    sounds.blow();
    let mainImg = document.getElementById("main-item");
    mainImg.style.transform = "scale(1.05)";
    setTimeout(nextStep, 800);
    
  } else if (stepData.action === "cut") {
    sounds.cut();
    let mainImg = document.getElementById("main-item");
    mainImg.src = "images/cake/slice.png"; 
    setTimeout(nextStep, 800);
    
  } else if (stepData.action === "feeding") {
    runFeeding();
  }
}

function nextStep() {
  currentStep++;
  if (currentStep < steps.length) {
    loadStep();
  }
}

// Hoạt cảnh đút bánh cho nhau
function runFeeding() {
  actionBtn.style.display = "none";
  const slice = document.createElement("img");
  slice.src = "images/cake/slice.png";
  slice.className = "feeding-slice";
  workspace.appendChild(slice);

  // Đút cho Girl (bên trái)
  setTimeout(() => {
    slice.style.transform = "translateX(-130px) translateY(60px) rotate(-20deg)";
    sounds.eat();
    createHeart(60, 180);
  }, 500);

  // Đút cho Boy (bên phải)
  setTimeout(() => {
    slice.style.transform = "translateX(130px) translateY(60px) rotate(20deg)";
    sounds.eat();
    createHeart(320, 180);
  }, 2200);

  // Hiện lời chúc
  setTimeout(() => {
    slice.style.opacity = "0";
    sounds.sparkle();
    finalScene();
  }, 4000);
}

// Tạo hiệu ứng tim bay
function createHeart(x, y) {
  const h = document.createElement("img");
  h.src = "images/effects/heart.png";
  h.className = "heart-pop";
  h.style.left = x + "px"; h.style.top = y + "px";
  workspace.appendChild(h);
  setTimeout(() => h.remove(), 1500);
}

// Cảnh cuối cùng với lời nhắn nhủ lãng mạn
function finalScene() {
  tray.innerHTML = "🎂🎂🎂";
  progressContainer.style.display = "none";
  actionBtn.style.display = "none";
  statusText.innerHTML = "";
  
  workspace.innerHTML = `
    <div class="final-message" style="text-align:center;">
      <h3 style="margin:0; font-size:22px;">💖 Mong mỗi năm đều được cùng anh</h3>
      <h3 style="margin:5px 0 15px 0; font-size:22px;">làm bánh và ăn bánh như thế này 🎂</h3>
      <img src="images/cake/full_nobg.png" onerror="this.src='images/cake/full.png'" style="width:160px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));">
    </div>
  `;
  sounds.sparkle();
  
  // Hiệu ứng tim bay liên tục ở màn hình cuối
  setInterval(() => createHeart(Math.random() * 300 + 20, 200), 1000);
}
