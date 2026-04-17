const CHARS_DARK  = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
const CHARS_LIGHT = CHARS_DARK.split('').reverse().join('');

let stream = null;
let animId = null;
const video   = document.getElementById('video');
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const output  = document.getElementById('ascii-output');
const status  = document.getElementById('status');

function getChars() {
  return document.getElementById('invertCheck').checked ? CHARS_LIGHT : CHARS_DARK;
}

async function startCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    await video.play();
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display  = 'inline-block';
    status.textContent = 'streaming';
    renderLoop();
  } catch (e) {
    status.textContent = 'error: ' + e.message;
  }
}

function stopCam() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (animId) cancelAnimationFrame(animId);
  stream = null; animId = null;
  output.textContent = 'Camera stopped.';
  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('stopBtn').style.display  = 'none';
  status.textContent = 'stopped';
}

function renderLoop() {
  animId = requestAnimationFrame(renderLoop);
  if (video.readyState < 2) return;

  const cols = parseInt(document.getElementById('densitySlider').value);
  const aspect = 0.55;
  const rows = Math.round(cols * (video.videoHeight / video.videoWidth) * aspect);

  canvas.width  = cols;
  canvas.height = rows;
  ctx.drawImage(video, 0, 0, cols, rows);

  const pixels = ctx.getImageData(0, 0, cols, rows).data;
  const chars   = getChars();
  const len     = chars.length - 1;
  const contrast = parseInt(document.getElementById('contrastSlider').value) / 100;
  let out = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      let brightness = (pixels[i]*0.299 + pixels[i+1]*0.587 + pixels[i+2]*0.114) / 255;
      brightness = Math.max(0, Math.min(1, (brightness - 0.5) * contrast + 0.5));
      out += chars[Math.round(brightness * len)];
    }
    out += '\n';
  }

  output.textContent = out;
  const targetW = Math.min(window.innerWidth - 80, 900);
  const fs = Math.max(4, Math.min(10, (targetW / cols) * 0.62));
  output.style.fontSize = fs + 'px';
}
