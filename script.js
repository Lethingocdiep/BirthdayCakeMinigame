// ====== ÂM THANH ======
let audioCtx;
const playSfx = (f, t, d) => {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
    o.stop(audioCtx.currentTime + d);
};

// ====== DỮ LIỆU GAME ======
const steps = [
    { text: "Cầm phới khuấy đều bột Matcha nào!", tool: "tools/whisk.png", main: "tools/bowl.png", target: "main", action: "mix" },
    { text: "Rót bột vào khuôn để chuẩn bị nướng", tool: "tools/bowl.png", main: "mold/empty.png", target: "main", action: "pour" },
    { text: "Đưa bánh vào lò nướng thôi!", tool: "mold/batter.png", main: "oven/oven.png", target: "main", action: "bake" },
    { text: "Phết một lớp kem tươi lên mặt bánh", tool: "tools/spatula.png", main: "cake/baked.png", target: "main", action: "frost" },
    { text: "Cắm nến lung linh cho buổi tiệc", tool: "decor/candle.png", main: "cake/frosted.png", target: "main", action: "decor" },
    { text: "Dùng dao cắt bánh thành từng miếng", tool: "tools/knife.png", main: "cake/full.png", target: "main", action: "cut" },
    { text: "Kéo miếng bánh đút cho từng người ăn nhé! ❤️", tool: "cake/slice.png", main: "cake/slice.png", target: "chibi" }
];

let currentStep = 0;
let fed = { girl: false, boy: false };

// ====== KHỞI ĐỘNG ======
document.getElementById("startBtn").onclick = function() {
    playSfx(600, 'sine', 0.1);
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-ui").style.display = "flex";
    document.getElementById("bg").classList.add("dimmed");
    loadStep();
};

function loadStep() {
    const s = steps[currentStep];
    document.getElementById("status-text").innerText = s.text;
    const ws = document.getElementById("workspace");
    ws.innerHTML = `<div id="baking-timer">00:05</div><img src="images/${s.main}" id="main-target" style="width:180px; transition: 0.3s;">`;
    
    const tray = document.getElementById("tray");
    tray.innerHTML = "";
    const tool = document.createElement("img");
    tool.src = `images/${s.tool}`;
    tool.onmousedown = startDrag;
    tray.appendChild(tool);
}

// ====== LOGIC TƯƠNG TÁC CHÍNH ======
function startDrag(e) {
    const tool = e.target;
    const rect = tool.getBoundingClientRect();
    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    tool.classList.add("dragging");
    tool.style.width = rect.width + 'px';
    
    function moveAt(px, py) {
        tool.style.left = px - shiftX + 'px';
        tool.style.top = py - shiftY + 'px';
    }

    function onMouseMove(ev) {
        moveAt(ev.clientX, ev.clientY);
        checkHover();
    }

    document.addEventListener('mousemove', onMouseMove);

    window.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        window.onmouseup = null;
        
        const s = steps[currentStep];
        const target = document.getElementById("main-target");
        const girl = document.getElementById("girl");
        const boy = document.getElementById("boy");

        if (s.target === "main" && isOver(tool, target)) {
            handleAction(s.action, tool, target);
        } else if (s.target === "chibi") {
            if (isOver(tool, girl) && !fed.girl) handleFeed(girl, 'girl', tool);
            else if (isOver(tool, boy) && !fed.boy) handleFeed(boy, 'boy', tool);
            else resetTool(tool);
        } else {
            resetTool(tool);
        }
    };
}

function handleAction(action, tool, target) {
    tool.style.display = "none"; // Ẩn tool để tạo cảm giác đang hòa nhập vào target
    
    if (action === "mix") {
        target.classList.add("mixing");
        playSfx(300, 'triangle', 0.5);
        setTimeout(() => { target.classList.remove("mixing"); finishStep(); }, 1000);
    } else if (action === "bake") {
        startBaking();
    } else {
        playSfx(800, 'sine', 0.2);
        finishStep();
    }
}

function handleFeed(char, person, tool) {
    playSfx(500, 'sine', 0.2);
    fed[person] = true;
    char.classList.add("chibi-eat");
    createHeart(char.offsetLeft + 70, char.offsetTop + 50);
    
    setTimeout(() => char.classList.remove("chibi-eat"), 800);

    if (fed.girl && fed.boy) {
        tool.remove();
        showFinal();
    } else {
        resetTool(tool);
    }
}

function finishStep() {
    currentStep++;
    if (currentStep < steps.length) loadStep();
}

function resetTool(tool) {
    tool.classList.remove("dragging");
    tool.style.position = "static";
    tool.style.display = "block";
    document.getElementById("tray").appendChild(tool);
}

function startBaking() {
    const timer = document.getElementById("baking-timer");
    timer.style.display = "block";
    let time = 5;
    playSfx(150, 'square', 0.5);
    let inv = setInterval(() => {
        time--;
        timer.innerText = `00:0${time}`;
        if (time <= 0) {
            clearInterval(inv);
            timer.style.display = "none";
            finishStep();
        }
    }, 1000);
}

function checkHover() {
    const tool = document.querySelector(".dragging");
    const target = document.getElementById("main-target");
    const girl = document.getElementById("girl");
    const boy = document.getElementById("boy");

    [target, girl, boy].forEach(el => {
        if (el && isOver(tool, el)) el.classList.add("highlight");
        else if (el) el.classList.remove("highlight");
    });
}

function isOver(a, b) {
    if (!a || !b) return false;
    let r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect();
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

function createHeart(x, y) {
    const h = document.createElement("div");
    h.innerHTML = "💖"; h.style.position = "absolute"; h.style.left = x + "px"; h.style.top = y + "px";
    h.style.fontSize = "40px"; h.style.zIndex = "1000";
    h.animate([{transform:'scale(0.5) translateY(0)', opacity:1}, {transform:'scale(1.5) translateY(-100px)', opacity:0}], 1000);
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1000);
}

function showFinal() {
    document.getElementById("status-text").innerText = "";
    document.getElementById("workspace").innerHTML = `
        <div class="final-quote">
            💖 Mong mỗi năm đều được cùng anh<br>
            làm bánh và ăn bánh như thế này 🎂
            <br><img src="images/cake/full.png" style="width:180px; margin-top:15px;">
        </div>
    `;
    setInterval(() => createHeart(Math.random()*window.innerWidth, Math.random()*window.innerHeight), 600);
}
