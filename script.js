// ====== ÂM THANH ======
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
const playSfx = (f, t, d) => {
    if(!audioCtx) audioCtx = new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d);
};
const sounds = {
    mix: () => playSfx(300, 'triangle', 0.2),
    pour: () => playSfx(400, 'sine', 0.4),
    bake: () => playSfx(150, 'square', 0.5),
    sparkle: () => { playSfx(800, 'sine', 0.3); setTimeout(()=>playSfx(1200,'sine',0.3), 100); },
    eat: () => playSfx(600, 'sine', 0.2)
};

// ====== DỮ LIỆU GAME ======
const steps = [
    { text: "Khuấy bột thôi! Kéo 'Whisk' vào tô matcha", tool: "tools/whisk.png", main: "tools/bowl.png", target: "main", nextMain: "mold/empty.png" },
    { text: "Đổ bột vào khuôn nhé!", tool: "tools/bowl.png", main: "mold/empty.png", target: "main", nextMain: "mold/batter.png" },
    { text: "Cho vào lò nướng nào!", tool: "mold/batter.png", main: "oven/oven.png", target: "main", special: "bake" },
    { text: "Phết kem lên bánh nướng", tool: "tools/spatula.png", main: "cake/baked.png", target: "main", nextMain: "cake/frosted.png" },
    { text: "Trang trí nến thôi!", tool: "decor/candle.png", main: "cake/frosted.png", target: "main", nextMain: "cake/full.png" },
    { text: "Cầm dao cắt một lát bánh nào", tool: "tools/knife.png", main: "cake/full.png", target: "main", nextMain: "cake/slice.png" },
    { text: "Tự tay đút cho từng người nhé!", tool: "cake/slice.png", main: "cake/slice.png", target: "chibi" }
];

let currentStep = 0;
let fed = { girl: false, boy: false };

function initGame() {
    loadStep();
}

function loadStep() {
    const s = steps[currentStep];
    document.getElementById("status-text").innerText = s.text;
    const ws = document.getElementById("workspace");
    ws.innerHTML = `<div id="baking-timer">00:05</div><img src="images/${s.main}" id="main-target" style="width:200px;">`;
    
    const tray = document.getElementById("tray");
    tray.innerHTML = "";
    
    // Tạo dụng cụ có thể kéo
    const tool = document.createElement("img");
    tool.src = `images/${s.tool}`;
    tool.classList.add("draggable-tool");
    tool.onmousedown = onMouseDown;
    tray.appendChild(tool);
}

// ====== LOGIC KÉO THẢ ======
function onMouseDown(e) {
    const tool = e.target;
    let coords = tool.getBoundingClientRect();
    let shiftX = e.clientX - coords.left;
    let shiftY = e.clientY - coords.top;

    tool.classList.add("dragging");
    tool.style.position = 'absolute';
    document.body.append(tool);

    moveAt(e.pageX, e.pageY);

    function moveAt(pageX, pageY) {
        tool.style.left = pageX - shiftX + 'px';
        tool.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(e) {
        moveAt(e.pageX, e.pageY);
        // Kiểm tra va chạm khi đang di chuyển
        checkOverlap(tool);
    }

    document.addEventListener('mousemove', onMouseMove);

    tool.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        tool.onmouseup = null;
        finalizeDrop(tool);
    };
}

function checkOverlap(tool) {
    const target = document.getElementById("main-target");
    const girl = document.getElementById("girl");
    const boy = document.getElementById("boy");
    
    if (isOver(tool, target)) target.classList.add("highlight");
    else target.classList.remove("highlight");
}

function finalizeDrop(tool) {
    const s = steps[currentStep];
    const target = document.getElementById("main-target");
    const girl = document.getElementById("girl");
    const boy = document.getElementById("boy");

    if (s.target === "main" && isOver(tool, target)) {
        if (s.special === "bake") {
            startBaking(tool);
        } else {
            successStep(tool);
        }
    } else if (s.target === "chibi") {
        if (isOver(tool, girl) && !fed.girl) { feed(girl, 'girl', tool); }
        else if (isOver(tool, boy) && !fed.boy) { feed(boy, 'boy', tool); }
        else { resetTool(tool); }
    } else {
        resetTool(tool);
    }
}

function successStep(tool) {
    sounds.sparkle();
    tool.remove();
    currentStep++;
    if (currentStep < steps.length) loadStep();
}

function resetTool(tool) {
    tool.classList.remove("dragging");
    document.getElementById("tray").appendChild(tool);
    tool.style.position = "static";
}

// ====== CÁC TÍNH NĂNG ĐẶC BIỆT ======
function startBaking(tool) {
    tool.remove();
    const timer = document.getElementById("baking-timer");
    timer.style.display = "block";
    let timeLeft = 5;
    sounds.bake();
    
    let interval = setInterval(() => {
        timeLeft--;
        timer.innerText = `00:0${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            timer.style.display = "none";
            steps[currentStep+1].main = "cake/baked.png"; // Bánh đã chín
            successStep({remove:()=>{}});
        }
    }, 1000);
}

function feed(char, p, tool) {
    sounds.eat();
    fed[p] = true;
    char.classList.add("chibi-talk");
    createHeart(char.offsetLeft + 50, char.offsetTop);
    
    if (fed.girl && fed.boy) {
        tool.remove();
        setTimeout(showFinal, 1000);
    } else {
        resetTool(tool); // Đút người này xong thì trả bánh về để đút người kia
    }
}

function isOver(el1, el2) {
    let r1 = el1.getBoundingClientRect();
    let r2 = el2.getBoundingClientRect();
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

function createHeart(x, y) {
    const h = document.createElement("img");
    h.src = "images/effects/heart.png";
    h.style.position = "absolute";
    h.style.left = x + "px"; h.style.top = y + "px";
    h.style.width = "40px";
    h.style.pointerEvents = "none";
    h.animate([{transform:'translateY(0) opacity(1)'}, {transform:'translateY(-100px) opacity(0)'}], 1500);
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1500);
}

function showFinal() {
    document.getElementById("status-text").innerText = "";
    document.getElementById("workspace").innerHTML = `
        <div class="final-quote">
            💖 Mong mỗi năm đều được cùng anh<br>
            làm bánh và ăn bánh như thế này 🎂<br>
            <img src="images/cake/full.png" style="width:180px; margin-top:20px;">
        </div>
    `;
    sounds.sparkle();
}

// Khởi động khi nhấn nút Start ở màn hình Chibi
document.getElementById("startBtn").onclick = () => {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-ui").style.display = "flex";
    document.getElementById("bg").classList.add("dimmed");
    initGame();
};
