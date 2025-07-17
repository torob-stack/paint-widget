
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let currentTool = "pencil";
let painting = false;
let brushSize = 5;
let currentColor = "#000000";
let textInput = null;

function selectTool(tool) {
  currentTool = tool;
}

function changeBrushSize(size) {
  brushSize = parseInt(size);
}

function changeColor(color) {
  currentColor = color;
}

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMousePos(e);
  if (currentTool === "text") {
    addTextBox(x, y);
    return;
  }
  painting = true;
  draw(e);
});

canvas.addEventListener("mouseup", () => {
  painting = false;
  ctx.beginPath();
});

canvas.addEventListener("mouseleave", () => {
  painting = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!painting || currentTool === "text") return;
  const { x, y } = getMousePos(e);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (currentTool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = brushSize;
  } else {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentTool === "pencil" ? 1 : brushSize;
  }

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function addTextBox(x, y) {
  if (textInput) return;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type text";
  input.style.position = "absolute";
  input.style.left = canvas.offsetLeft + x + "px";
  input.style.top = canvas.offsetTop + y + "px";
  input.style.fontSize = brushSize * 3 + "px";
  input.style.zIndex = 100;
  input.style.border = "1px dashed #333";
  input.style.background = "#fff";

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";
  applyBtn.style.position = "absolute";
  applyBtn.style.left = canvas.offsetLeft + x + 100 + "px";
  applyBtn.style.top = canvas.offsetTop + y + "px";
  applyBtn.style.zIndex = 101;

  document.body.appendChild(input);
  document.body.appendChild(applyBtn);
  textInput = input;

  applyBtn.addEventListener("click", () => {
    const tx = parseInt(input.style.left) - canvas.offsetLeft;
    const ty = parseInt(input.style.top) - canvas.offsetTop;
    ctx.fillStyle = currentColor;
    ctx.font = input.style.fontSize + " sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(input.value, tx, ty);
    document.body.removeChild(input);
    document.body.removeChild(applyBtn);
    textInput = null;
  });
}

let undoStack = [];

function saveState() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > 20) undoStack.shift();
}

function undo() {
  if (undoStack.length > 0) {
    const imgData = undoStack.pop();
    ctx.putImageData(imgData, 0, 0);
  }
}

let airbrushInterval = null;

function spray(x, y) {
  const density = 20;
  for (let i = 0; i < density; i++) {
    const offsetX = Math.random() * brushSize * 2 - brushSize;
    const offsetY = Math.random() * brushSize * 2 - brushSize;
    if (offsetX ** 2 + offsetY ** 2 <= brushSize ** 2) {
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
  }
}

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMousePos(e);
  if (currentTool === "text") {
    addTextBox(x, y);
    return;
  }
  saveState();
  painting = true;
  if (currentTool === "airbrush") {
    airbrushInterval = setInterval(() => spray(x, y), 20);
  } else {
    draw(e);
  }
});

canvas.addEventListener("mouseup", () => {
  painting = false;
  ctx.beginPath();
  clearInterval(airbrushInterval);
});

canvas.addEventListener("mouseleave", () => {
  painting = false;
  ctx.beginPath();
  clearInterval(airbrushInterval);
});

function draw(e) {
  if (!painting || currentTool === "text" || currentTool === "airbrush") return;
  const { x, y } = getMousePos(e);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (currentTool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = brushSize;
  } else {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentTool === "pencil" ? 1 : brushSize;
  }

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

// Draggable text input
function addTextBox(x, y) {
  if (textInput) return;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type text";
  input.style.position = "absolute";
  input.style.left = canvas.offsetLeft + x + "px";
  input.style.top = canvas.offsetTop + y + "px";
  input.style.fontSize = brushSize * 3 + "px";
  input.style.zIndex = 100;
  input.style.border = "1px dashed #333";
  input.style.background = "#fff";
  input.style.cursor = "move";

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";
  applyBtn.style.position = "absolute";
  applyBtn.style.left = canvas.offsetLeft + x + 100 + "px";
  applyBtn.style.top = canvas.offsetTop + y + "px";
  applyBtn.style.zIndex = 101;

  document.body.appendChild(input);
  document.body.appendChild(applyBtn);
  textInput = input;
  input.focus();

  let dragging = false;
  let offsetX, offsetY;

  input.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });

  document.addEventListener("mousemove", (e) => {
    if (dragging) {
      input.style.left = e.clientX - offsetX + "px";
      input.style.top = e.clientY - offsetY + "px";
      applyBtn.style.left = parseInt(input.style.left) + 100 + "px";
      applyBtn.style.top = input.style.top;
    }
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  applyBtn.addEventListener("click", () => {
    const tx = parseInt(input.style.left) - canvas.offsetLeft;
    const ty = parseInt(input.style.top) - canvas.offsetTop;
    ctx.fillStyle = currentColor;
    ctx.font = input.style.fontSize + " sans-serif";
    ctx.textBaseline = "top";
    saveState();
    ctx.fillText(input.value, tx, ty);
    document.body.removeChild(input);
    document.body.removeChild(applyBtn);
    textInput = null;
  });
}
