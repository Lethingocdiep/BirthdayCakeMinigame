const steps = [
  { name: "Nướng bánh", items: ["oven/oven.png"], main: "oven/baking.png" },
  { name: "Phết kem", items: ["tools/spatula.png","ingredients/cream.png"], main: "cake/frosted.png" },
  { name: "Trang trí", items: ["decor/grape.png","decor/candle.png"], main: "cake/full.png" }
];

let step = 0;

const tray = document.getElementById("tray");
const workspace = document.getElementById("workspace");
const btn = document.getElementById("nextBtn");

function loadStep() {
  tray.innerHTML = "";
  workspace.innerHTML = `<img src="images/${steps[step].main}" style="width:260px">`;

  steps[step].items.forEach(i => {
    const img = document.createElement("img");
    img.src = "images/" + i;
    tray.appendChild(img);
  });

  btn.innerText = step === 0 ? "Start 💚" : "Next ➜";
}

btn.onclick = () => {
  step++;
  if(step < steps.length) loadStep();
  else finalScene();
}

function finalScene(){
  tray.innerHTML = "";
  workspace.innerHTML = `
    <div style="text-align:center">
      <img src="images/cake/full.png" style="width:260px"><br>
      <h2 style="color:#e91e63">Happy Birthday My Fiance ❤️</h2>
      <img src="images/effects/sparkle.png" style="width:80px">
    </div>
  `;
  btn.style.display = "none";
}

loadStep();