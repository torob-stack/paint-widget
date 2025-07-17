
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let currentTool = "pencil";
let painting = false;
let brushSize = 5;
let currentColor = "#000000";
let textInput = null;
let undoStack = [];
let airbrushInterval = null;
let mouseX = 0, mouseY = 0;
let startX = 0, startY = 0;

function selectTool(tool) {
  currentTool = tool;
  updateCursor();
  updateCursor();
  canvas.className = tool;
  currentTool = tool;
}
function changeBrushSize(size) {
  brushSize = parseInt(size);
}
function changeColor(color) {
  currentColor = color;
}
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
function clearCanvas() {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function spray(x, y) {
  const density = 20;
  for (let i = 0; i < density; i++) {
    const offsetX = Math.random() * brushSize * 2 - brushSize;
    const offsetY = Math.random() * brushSize * 2 - brushSize;
    if (offsetX ** 2 + offsetY ** 2 <= brushSize ** 2) {
      ctx.fillStyle = currentColor;
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
  }
}

let previewCanvas = document.getElementById("preview-canvas") || document.createElement("canvas");
const previewCtx = previewCanvas.getContext("2d");
previewCanvas.width = canvas.width;
previewCanvas.height = canvas.height;
previewCanvas.style.position = "absolute";
previewCanvas.style.left = canvas.offsetLeft + "px";
previewCanvas.style.top = canvas.offsetTop + "px";
previewCanvas.style.pointerEvents = "none";
previewCanvas.style.zIndex = 5;
document.getElementById("canvas-container").appendChild(previewCanvas);

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMousePos(e);
  if (currentTool === "text") {
    addTextBox(x, y);
    return;
  }
  saveState();
  painting = true;
  startX = x;
  startY = y;
  if (currentTool === "airbrush") {
    airbrushInterval = setInterval(() => spray(mouseX, mouseY), 20);
  } else if (!["line", "rect", "ellipse"].includes(currentTool)) {
    draw(e);
  }
});

canvas.addEventListener("mousemove", (e) => {
  const { x, y } = getMousePos(e);
  mouseX = x;
  mouseY = y;
  if (!painting) return;
  if (["line", "rect", "ellipse"].includes(currentTool)) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.strokeStyle = currentColor;
    previewCtx.lineWidth = brushSize;
    previewCtx.beginPath();
    if (currentTool === "line") {
      previewCtx.moveTo(startX, startY);
      previewCtx.lineTo(x, y);
    } else if (currentTool === "rect") {
      previewCtx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === "ellipse") {
      const radiusX = Math.abs(x - startX) / 2;
      const radiusY = Math.abs(y - startY) / 2;
      const centerX = (x + startX) / 2;
      const centerY = (y + startY) / 2;
      previewCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    }
    previewCtx.stroke();
  } else if (currentTool !== "airbrush") {
    draw(e);
  }
});

canvas.addEventListener("mouseup", (e) => {
  painting = false;
  ctx.beginPath();
  clearInterval(airbrushInterval);
  const { x, y } = getMousePos(e);
  if (["line", "rect", "ellipse"].includes(currentTool)) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    if (currentTool === "line") {
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
    } else if (currentTool === "rect") {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === "ellipse") {
      const radiusX = Math.abs(x - startX) / 2;
      const radiusY = Math.abs(y - startY) / 2;
      const centerX = (x + startX) / 2;
      const centerY = (y + startY) / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    }
    ctx.stroke();
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
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
  ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
  ctx.lineWidth = currentTool === "pencil" ? 1 : brushSize * 1.2;
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function addTextBox(x, y) {
  if (textInput) return;
  const input = document.createElement("textarea");
  
  input.placeholder = "Type text...\n(Multiline supported)";
  input.style.position = "absolute";
  input.style.left = canvas.offsetLeft + x + "px";
  input.style.top = canvas.offsetTop + y + "px";
  input.style.fontSize = brushSize * 3 + "px";
  input.style.width = "150px";
  input.style.height = "25px";
  input.style.zIndex = 100;
  input.style.border = "1px dashed #333";
  input.style.background = "#fff";
  input.style.cursor = "move";
  input.style.resize = "none";
  input.style.overflow = "hidden";
  input.style.padding = "5px";
  input.style.lineHeight = "1.2";

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply";
  applyBtn.style.position = "absolute";
  applyBtn.style.left = canvas.offsetLeft + x + 160 + "px";
  applyBtn.style.top = canvas.offsetTop + y + "px";
  applyBtn.style.zIndex = 101;

  document.body.appendChild(input);
  input.addEventListener("input", () => adjustTextInputSize(input));
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
    const lines = input.value.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, tx, ty + i * parseInt(input.style.fontSize));
    });
    document.body.removeChild(input);
    document.body.removeChild(applyBtn);
    textInput = null;
  });
}

function autosizeTextarea(el) {
  el.style.height = "auto";
  el.style.width = "auto";
  const tmp = document.createElement("div");
  tmp.style.position = "absolute";
  tmp.style.visibility = "hidden";
  tmp.style.whiteSpace = "pre-wrap";
  tmp.style.wordWrap = "break-word";
  tmp.style.font = el.style.font;
  tmp.style.lineHeight = el.style.lineHeight;
  tmp.style.padding = el.style.padding;
  tmp.style.width = "fit-content";
  tmp.style.maxWidth = "300px";
  tmp.innerText = el.value || el.placeholder;
  document.body.appendChild(tmp);
  el.style.width = tmp.offsetWidth + 20 + "px";
  el.style.height = tmp.offsetHeight + 10 + "px";
  document.body.removeChild(tmp);
}

function updateCursor() {
  let cursor = "crosshair";
  if (currentTool === "brush") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize*2}' height='${brushSize*2}'><circle cx='${brushSize}' cy='${brushSize}' r='${brushSize}' fill='black'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize} ${brushSize}, auto`;
  } else if (currentTool === "eraser") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><rect width='${brushSize}' height='${brushSize}' fill='gray'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize/2} ${brushSize/2}, auto`;
  } else if (currentTool === "airbrush") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize/2}' cy='${brushSize/2}' r='2' fill='gray'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize/2} ${brushSize/2}, auto`;
  }
  canvas.style.cursor = cursor;
  const preview = document.getElementById("cursorPreview");
  preview.innerHTML = `<svg width='${brushSize*2}' height='${brushSize*2}'><circle cx='${brushSize}' cy='${brushSize}' r='${brushSize}' fill='black'/></svg>`;
}

document.getElementById("brushSize").addEventListener("input", function () {
  changeBrushSize(this.value);
  updateCursor();
});

function syncBrushSize(value) {
  brushSize = parseInt(value);
  document.getElementById("brushSize").value = brushSize;
  document.getElementById("brushSizeNumber").value = brushSize;
  updateCursor();
}

// Override updateCursor to reflect tool and show realistic preview
function updateCursor() {
  let cursor = "crosshair";
  let svg = "";
  const preview = document.getElementById("cursorPreview");

  if (currentTool === "brush") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize*2}' height='${brushSize*2}'><circle cx='${brushSize}' cy='${brushSize}' r='${brushSize}' fill='black'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize} ${brushSize}, auto`;
    preview.innerHTML = svg;
  } else if (currentTool === "eraser") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><rect width='${brushSize}' height='${brushSize}' fill='gray'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize/2} ${brushSize/2}, auto`;
    preview.innerHTML = svg;
  } else if (currentTool === "airbrush") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize/2}' cy='${brushSize/2}' r='2' fill='gray'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${brushSize/2} ${brushSize/2}, auto`;
    preview.innerHTML = svg;
  } else if (currentTool === "pencil") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='1' height='1' fill='black'/></svg>`;
    cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") 1 1, auto`;
    preview.innerHTML = svg;
  } else if (currentTool === "text") {
    preview.innerHTML = `<div style='font-size: ${brushSize * 3}px;'>abc</div>`;
  } else {
    preview.innerHTML = "";
  }

  canvas.style.cursor = cursor;
}

function adjustTextInputSize(el) {
  el.style.height = "auto";
  const lines = el.value.split("\n").length || 1;
  const px = parseInt(el.style.fontSize);
  el.style.height = (lines * px * 1.2) + "px";
}
