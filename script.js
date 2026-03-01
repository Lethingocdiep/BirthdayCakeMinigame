// ====== ÂM THANH ======
let audioCtx;
const playSfx = (f, t, d) => {
    try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
        o.stop(audioCtx.currentTime + d);
    } catch(e) {}
};

// ====== BƯỚC CHƠI ======
const steps = [
    { text: "Khuấy bột Matcha thôi!", tool: "tools/whisk.png", main: "tools/bowl.png", target: "main", action: "mix" },
    { text: "Đổ bột vào khuôn nhé", tool: "tools/bowl.png", main: "mold/empty.png", target: "main", action: "pour" },
    { text: "Cho bánh vào lò nướng nào", tool: "mold/batter.png", main: "oven/oven.png", target: "main", action: "bake" },
    { text: "Phết kem lên bánh nướng", tool: "tools/spatula.png", main: "cake/baked.png", target: "main", action: "frost" },
    { text: "Trang trí nến lung linh", tool: "decor/candle.png", main: "cake/frosted.png", target: "main", action: "decor" },
    { text: "Cắt bánh thành từng miếng", tool: "tools/knife.png", main: "cake/full.png", target: "main", action: "cut" },
    { text: "Đút cho Diane và Anh yêu ăn nào! ❤️", tool: "cake/slice.png", main: "cake/slice.png", target: "chibi" }
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
    ws.innerHTML = `<div id="baking-timer">00:05</div><img src="images/${s.main}" id="main-target" style="width:190px;">`;
    
    const tray = document.getElementById("tray");
    tray.innerHTML = "";
    const tool = document.createElement("img");
    tool.src = `images/${s.tool}`;
    tool.id = "active-tool";
    tool.onmousedown = startDrag;
    tray.appendChild(tool);
}

// ====== LOGIC KÉO THẢ CHÍNH ======
function startDrag(e) {
    const tool = e.target;
    const rect = tool.getBoundingClientRect();
    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    tool.classList.add("dragging");
    
    function moveAt(px, py) {
        tool.style.left = px - shiftX + 'px';
        tool.style.top = py - shiftY + 'px';
    }

    function onMouseMove(ev) {
        moveAt(ev.clientX, ev.clientY);
        checkHover(tool);
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
            handleMainAction(s.action, tool, target);
        } else if (s.target === "chibi") {
            if (isOver(tool, girl) && !fed.girl) {
                handleFeed(girl, 'girl', tool);
            } else if (isOver(tool, boy) && !fed.boy) {
                handleFeed(boy, 'boy', tool);
            } else {
                resetTool(tool);
            }
        } else {
            resetTool(tool);
        }
    };
}

function handleMainAction(action, tool, target) {
    playSfx(800, 'sine', 0.2);
    if (action === "bake") {
        tool.style.display = "none";
        startBaking();
    } else {
        target.style.transform = "scale(1.2)";
        setTimeout(() => {
            target.style.transform = "scale(1)";
            currentStep++;
            loadStep();
        }, 300);
    }
}

function handleFeed(char, person, tool) {
    playSfx(500, 'sine', 0.2);
    fed[person] = true;
    
    // Hiệu ứng ăn
    char.classList.add("chibi-eat");
    createHeart(char.offsetLeft + 80, char.offsetTop + 40);
    
    setTimeout(() => {
        char.classList.remove("chibi-eat");
        char.classList.remove("highlight");
        
        if (fed.girl && fed.boy) {
            tool.remove();
            showFinal();
        } else {
            resetTool(tool);
        }
    }, 600);
}

function resetTool(tool) {
    tool.classList.remove("dragging");
    tool.style.position = "static";
    tool.style.left = "auto";
    tool.style.top = "auto";
    document.getElementById("tray").appendChild(tool);
    
    // Xóa highlight cũ
    document.getElementById("girl").classList.remove("highlight");
    document.getElementById("boy").classList.remove("highlight");
    if(document.getElementById("main-target")) document.getElementById("main-target").classList.remove("highlight");
}

function checkHover(tool) {
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

function startBaking() {
    const timer = document.getElementById("baking-timer");
    timer.style.display = "block";
    let time = 5;
    playSfx(200, 'square', 0.5);
    let inv = setInterval(() => {
        time--;
        timer.innerText = `00:0${time}`;
        if (time <= 0) {
            clearInterval(inv);
            timer.style.display = "none";
            currentStep++;
            loadStep();
        }
    }, 1000);
}

function createHeart(x, y) {
    const h = document.createElement("div");
    h.innerHTML = "💖"; h.style.position = "absolute"; h.style.left = x + "px"; h.style.top = y + "px";
    h.style.fontSize = "45px"; h.style.zIndex = "1000"; h.style.pointerEvents = "none";
    h.animate([{transform:'scale(0.5) translateY(0)', opacity:1}, {transform:'scale(1.8) translateY(-120px)', opacity:0}], 1200);
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
}

function showFinal() {
    document.getElementById("status-text").innerText = ""; // Xóa text "Đút cho..."
    const ws = document.getElementById("workspace");
    ws.style.border = "none";
    ws.style.background = "transparent";
    ws.innerHTML = `
        <div class="final-quote">
            💖 Mong mỗi năm đều được cùng anh<br>
            làm bánh và ăn bánh như thế này 🎂
            <br><img src="images/cake/full.png" style="width:200px; margin-top:20px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));">
        </div>
    `;
    // Bắn tim liên tục
    setInterval(() => {
        createHeart(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    }, 400);
}
