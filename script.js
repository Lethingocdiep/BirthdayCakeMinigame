// ====== HỆ THỐNG ÂM THANH ======
let audioCtx;
const playSfx = (freq, type, dur) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur);
};

const sounds = {
    pop: () => playSfx(600, 'sine', 0.1),
    mix: () => playSfx(300, 'triangle', 0.2),
    pour: () => playSfx(400, 'sine', 0.4),
    bake: () => playSfx(150, 'square', 0.5),
    sparkle: () => { playSfx(800, 'sine', 0.3); setTimeout(() => playSfx(1200, 'sine', 0.3), 100); },
    eat: () => playSfx(500, 'sine', 0.2)
};

// ====== DỮ LIỆU CÁC BƯỚC ======
const steps = [
    { text: "Khuấy bột thôi! Kéo 'Whisk' vào tô", tool: "tools/whisk.png", main: "tools/bowl.png", target: "main" },
    { text: "Đổ bột vào khuôn nhé!", tool: "tools/bowl.png", main: "mold/empty.png", target: "main" },
    { text: "Cho vào lò nướng nào!", tool: "mold/batter.png", main: "oven/oven.png", target: "main", special: "bake" },
    { text: "Phết kem lên bánh nướng", tool: "tools/spatula.png", main: "cake/baked.png", target: "main" },
    { text: "Trang trí nến thôi!", tool: "decor/candle.png", main: "cake/frosted.png", target: "main" },
    { text: "Cầm dao cắt một lát bánh nào", tool: "tools/knife.png", main: "cake/full.png", target: "main" },
    { text: "Đút cho Diane và Anh yêu ăn nào! ❤️", tool: "cake/slice.png", main: "cake/slice.png", target: "chibi" }
];

let currentStep = 0;
let fed = { girl: false, boy: false };

// ====== KHỞI ĐỘNG ======
document.getElementById("startBtn").onclick = function() {
    sounds.pop();
    document.getElementById("start-screen").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("start-screen").style.display = "none";
        document.getElementById("game-ui").style.display = "flex";
        document.getElementById("bg").classList.add("dimmed");
        loadStep();
    }, 500);
};

function loadStep() {
    const s = steps[currentStep];
    document.getElementById("status-text").innerText = s.text;
    const ws = document.getElementById("workspace");
    ws.innerHTML = `<div id="baking-timer">00:05</div><img src="images/${s.main}" id="main-target" style="width:180px;">`;
    
    const tray = document.getElementById("tray");
    tray.innerHTML = "";
    const tool = document.createElement("img");
    tool.src = `images/${s.tool}`;
    tool.onmousedown = startDrag;
    tray.appendChild(tool);
}

// ====== LOGIC KÉO THẢ ======
function startDrag(e) {
    const tool = e.target;
    tool.classList.add("dragging");
    let shiftX = e.clientX - tool.getBoundingClientRect().left;
    let shiftY = e.clientY - tool.getBoundingClientRect().top;

    document.body.append(tool);
    moveAt(e.pageX, e.pageY);

    function moveAt(px, py) {
        tool.style.left = px - shiftX + 'px';
        tool.style.top = py - shiftY + 'px';
    }

    function onMouseMove(ev) {
        moveAt(ev.pageX, ev.pageY);
        const target = document.getElementById("main-target");
        if (isOver(tool, target)) target.classList.add("highlight");
        else target.classList.remove("highlight");
    }

    document.addEventListener('mousemove', onMouseMove);

    tool.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        const s = steps[currentStep];
        const target = document.getElementById("main-target");
        const girl = document.getElementById("girl");
        const boy = document.getElementById("boy");

        if (s.target === "main" && isOver(tool, target)) {
            if (s.special === "bake") startBaking(tool);
            else nextStep(tool);
        } else if (s.target === "chibi") {
            if (isOver(tool, girl) && !fed.girl) doFeed(girl, 'girl', tool);
            else if (isOver(tool, boy) && !fed.boy) doFeed(boy, 'boy', tool);
            else returnToTray(tool);
        } else {
            returnToTray(tool);
        }
    };
}

function nextStep(tool) {
    sounds.sparkle();
    if(tool) tool.remove();
    currentStep++;
    if (currentStep < steps.length) loadStep();
}

function returnToTray(tool) {
    tool.classList.remove("dragging");
    tool.style.position = "static";
    document.getElementById("tray").appendChild(tool);
}

function startBaking(tool) {
    tool.remove();
    const timer = document.getElementById("baking-timer");
    timer.style.display = "block";
    let time = 5;
    sounds.bake();
    let inv = setInterval(() => {
        time--;
        timer.innerText = `00:0${time}`;
        if (time <= 0) {
            clearInterval(inv);
            timer.style.display = "none";
            nextStep();
        }
    }, 1000);
}

function doFeed(char, p, tool) {
    sounds.eat();
    fed[p] = true;
    char.classList.add("chibi-talk");
    createHeart(char.offsetLeft + 50, char.offsetTop + 50);
    setTimeout(() => char.classList.remove("chibi-talk"), 1000);
    
    if (fed.girl && fed.boy) {
        tool.remove();
        showFinal();
    } else {
        returnToTray(tool);
    }
}

function isOver(a, b) {
    let r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect();
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

function createHeart(x, y) {
    const h = document.createElement("div");
    h.innerHTML = "💖";
    h.style.position = "absolute"; h.style.left = x + "px"; h.style.top = y + "px";
    h.style.fontSize = "30px"; h.style.zIndex = "2000";
    h.animate([{transform:'translateY(0)', opacity:1}, {transform:'translateY(-100px)', opacity:0}], 1500);
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1500);
}

function showFinal() {
    sounds.sparkle();
    document.getElementById("workspace").innerHTML = `
        <div class="final-quote">
            💖 Mong mỗi năm đều được cùng anh<br>
            làm bánh và ăn bánh như thế này 🎂
            <br><img src="images/cake/full.png" style="width:160px; margin-top:15px;">
        </div>
    `;
    document.getElementById("status-text").innerText = "Happy Anniversary!";
    setInterval(() => createHeart(Math.random()*window.innerWidth, 400), 800);
}
