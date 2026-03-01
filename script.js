// ====== HỆ THỐNG ÂM THANH (KHÔNG CẦN FILE NGOÀI) ======
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

// Các hiệu ứng âm thanh tự tạo
const sounds = {
  mix: () => playTone(300, 'square', 0.1, 0.05), // Tiếng khuấy
  pour: () => playTone(400, 'sine', 0.3, 0.1),   // Tiếng rót
  bake: () => playTone(150, 'triangle', 0.5, 0.1), // Tiếng lò nướng
  sparkle: () => { // Tiếng lấp lánh (hoàn thành)
    playTone(800, 'sine', 0.2, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.3, 0.1), 100);
    setTimeout(() => playTone(1600, 'sine', 0.4, 0.1), 200);
  },
  blow: () => playTone(100, 'sawtooth', 0.8, 0.1) // Tiếng thổi nến (mô phỏng)
};

// ====== DỮ LIỆU CÁC BƯỚC GAME ======
const steps = [
  { id: "start", text: "Cùng làm bánh kem Matcha nhé! ❤️", btn: "Start ➜" },
  { id: "mix", text: "Bước 1: Đánh bột thật đều tay!", main: "tools/bowl.png", items: ["tools/whisk.png"], btn: "Khuấy bột", action: "progress" },
  { id: "pour", text: "Bước 2: Đổ bột vào khuôn", main: "tools/mold.png", items: ["tools/bowl.png"], btn: "Đổ bột", action: "click" },
  { id: "bake", text: "Bước 3: Nướng bánh trong lò", main: "oven/oven.png", items: [], btn: "Nướng bánh", action: "progress_auto" },
  { id: "cream", text: "Bước 4: Làm kem Matcha (Thêm Matcha + Sữa)", main: "tools/bowl_cream.png", items: ["ingredients/matcha.png", "ingredients/cream.png"], btn: "Trộn kem", action: "progress" },
  { id: "frost", text: "Bước 5: Phết kem lên bánh", main: "cake/bare_cake.png", items: ["tools/spatula.png"], btn: "Phết kem", action: "click" },
  { id: "decor", text: "Bước 6: Trang trí bánh", main: "cake/frosted.png", items: ["decor/topping.png", "decor/candle.png"], btn: "Trang trí", action: "click" },
  { id: "final", text: "Hoàn thành! Hãy thổi nến nào!", main: "cake/full.png", items: [], btn: "Thổi nến 🌬️", action: "finish" }
];

let currentStep = 0;
let progress = 0;

// Các phần tử DOM
const statusText = document.getElementById("status-text");
const workspace = document.getElementById("workspace");
const tray = document.getElementById("tray");
const actionBtn = document.getElementById("actionBtn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

// Hàm tải giao diện theo từng bước
function loadStep() {
  progress = 0;
  const stepData = steps[currentStep];
  
  statusText.innerHTML = stepData.text;
  actionBtn.innerText = stepData.btn;
  actionBtn.style.display = "inline-block";
  progressContainer.style.display = "none";
  progressBar.style.width = "0%";
  tray.innerHTML = "";

  // Render ảnh main vào workspace
  if (stepData.main) {
    workspace.innerHTML = `<img src="images/${stepData.main}" style="width:200px; transition: 0.3s;" id="main-item">`;
  } else {
    workspace.innerHTML = `<h2 style="color:#d81b60">Chào mừng bạn!</h2>`;
  }

  // Render các item trên khay
  if (stepData.items) {
    stepData.items.forEach(i => {
      const img = document.createElement("img");
      img.src = "images/" + i;
      tray.appendChild(img);
    });
  }
}

// Xử lý sự kiện nút bấm
actionBtn.onclick = () => {
  initAudio(); // Khởi tạo âm thanh tương tác
  const stepData = steps[currentStep];

  if (currentStep === 0) {
    // Từ Start chuyển sang Bước 1
    nextStep();
  } else if (stepData.action === "progress") {
    // Click nhiều lần để đầy thanh tiến trình (Khuấy)
    progressContainer.style.display = "block";
    progress += 20;
    progressBar.style.width = progress + "%";
    sounds.mix();

    if (progress >= 100) {
      setTimeout(nextStep, 500);
    }
  } else if (stepData.action === "click") {
    // Click 1 lần để thực hiện (Đổ khuôn, Phết kem, Trang trí)
    sounds.pour();
    let mainImg = document.getElementById("main-item");
    mainImg.style.transform = "scale(1.1) rotate(5deg)";
    setTimeout(nextStep, 600);
  } else if (stepData.action === "progress_auto") {
    // Tự động chạy tiến trình (Nướng bánh)
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
  } else if (stepData.action === "finish") {
    // Thổi nến và kết thúc
    sounds.blow();
    finalScene();
  }
}

function nextStep() {
  currentStep++;
  if (currentStep < steps.length) {
    loadStep();
  } else {
    finalScene();
  }
}

// Cảnh cuối cùng
function finalScene() {
  tray.innerHTML = "";
  progressContainer.style.display = "none";
  actionBtn.style.display = "none";
  statusText.innerHTML = "";
  
  workspace.innerHTML = `
    <div style="text-align:center">
      <h2 class="sparkle-text">Happy Birthday My Fiance ❤️</h2>
      <img src="images/cake/full_nobg.png" onerror="this.src='images/cake/full.png'" style="width:240px; margin-bottom: 10px;"><br>
      <img src="images/effects/sparkle.png" onerror="this.style.display='none'" style="width:80px; position:absolute; top:20px; right:20px;">
      <img src="images/effects/sparkle.png" onerror="this.style.display='none'" style="width:60px; position:absolute; bottom:40px; left:20px;">
    </div>
  `;
  sounds.sparkle();
}

// Khởi chạy
loadStep();
