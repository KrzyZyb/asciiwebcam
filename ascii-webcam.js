const CHARS_DARK  = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
const CHARS_LIGHT = CHARS_DARK.split('').reverse().join('');

let stream      = null;
let animId      = null;
let invertOn    = false;
let camViewOn   = false;

const video       = document.getElementById('video');
const placeholder = document.getElementById('cam-placeholder');
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const output      = document.getElementById('ascii-output');
const status      = document.getElementById('status');

// ── Drawer ──────────────────────────────────────────────────
function toggleDrawer() {
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('drawer-overlay').classList.toggle('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

// ── Fullscreen ───────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen)       el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    document.getElementById('fullscreenBtn').classList.add('on');
  } else {
    if (document.exitFullscreen)       document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    document.getElementById('fullscreenBtn').classList.remove('on');
  }
}

// Keep button state in sync if user presses Escape
document.addEventListener('fullscreenchange', () => {
  document.getElementById('fullscreenBtn')
    .classList.toggle('on', !!document.fullscreenElement);
});
document.addEventListener('webkitfullscreenchange', () => {
  document.getElementById('fullscreenBtn')
    .classList.toggle('on', !!document.webkitFullscreenElement);
});

// ── Toggle: Invert ───────────────────────────────────────────
function toggleInvert() {
  invertOn = !invertOn;
  document.getElementById('invertBtn').classList.toggle('on', invertOn);
}

// ── Toggle: Cam View ─────────────────────────────────────────
function toggleCamView() {
  camViewOn = !camViewOn;
  document.getElementById('camViewBtn').classList.toggle('on', camViewOn);
  if (stream) {
    video.classList.toggle('visible', camViewOn);
    placeholder.classList.add('hidden');
  } else {
    placeholder.classList.toggle('hidden', !camViewOn);
  }
  syncPanelSizes();
}

// ── Start / Stop ─────────────────────────────────────────────
async function startCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    await video.play();
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display  = 'inline-block';
    if (camViewOn) {
      video.classList.add('visible');
      placeholder.classList.add('hidden');
    }
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
  video.classList.remove('visible');
  output.textContent = 'Camera stopped.';
  if (camViewOn) placeholder.classList.remove('hidden');
  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('stopBtn').style.display  = 'none';
  status.textContent = 'stopped';
  syncPanelSizes();
}

// ── Size sync ────────────────────────────────────────────────
function syncPanelSizes() {
  const rect = output.getBoundingClientRect();
  const w = rect.width  + 'px';
  const h = rect.height + 'px';
  video.style.width        = w;
  video.style.height       = h;
  placeholder.style.width  = w;
  placeholder.style.height = h;
}

// ── Render loop ──────────────────────────────────────────────
function renderLoop() {
  animId = requestAnimationFrame(renderLoop);
  if (video.readyState < 2) return;

  const isFS     = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const isMobile = window.innerWidth < 600;
  const maxCols  = isMobile ? 60 : 160;
  const aspect   = 0.55;
  const maxRows  = Math.round(maxCols * (video.videoHeight / video.videoWidth) * aspect);
  const cols     = Math.min(parseInt(document.getElementById('densitySlider').value), maxCols);
  const rows     = Math.round(cols * (video.videoHeight / video.videoWidth) * aspect);

  // Always sample at maxCols x maxRows — stride picks every Nth pixel
  // so lower density = bigger blocks but same overall image size
  canvas.width  = maxCols;
  canvas.height = maxRows;
  ctx.drawImage(video, 0, 0, maxCols, maxRows);

  const pixels   = ctx.getImageData(0, 0, maxCols, maxRows).data;
  const chars    = invertOn ? CHARS_LIGHT : CHARS_DARK;
  const len      = chars.length - 1;
  const contrast = parseInt(document.getElementById('contrastSlider').value) / 100;
  const gamma    = parseInt(document.getElementById('gammaSlider').value) / 100;

  // Stride: how many canvas pixels each output character represents
  const strideX = maxCols / cols;
  const strideY = maxRows / rows;

  // No space-padding — explicit width/height + CSS centers everything
  let out = '';

  for (let r = 0; r < rows; r++) {
    const srcRow = Math.floor(r * strideY);
    for (let c = 0; c < cols; c++) {
      const srcCol = Math.floor(c * strideX);
      const i = (srcRow * maxCols + srcCol) * 4;
      let b = (pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114) / 255;
      b = Math.pow(Math.max(0, b), 1 / gamma);
      b = Math.max(0, Math.min(1, (b - 0.5) * contrast + 0.5));
      out += chars[Math.round(b * len)];
    }
    out += '\n';
  }

  output.textContent = out;

  if (isFS) {
    const fsW    = camViewOn ? window.innerWidth / 2 : window.innerWidth;
    const fsByW  = fsW / (cols * 0.6);
    const fsByH  = window.innerHeight / (rows * 1.1);
    const fsFont = Math.max(4, Math.min(fsByW, fsByH));
    output.style.fontSize = fsFont + 'px';
    output.style.width    = (cols * fsFont * 0.6) + 'px';
    output.style.height   = '';
    document.body.style.overflow = 'hidden';
  } else {
    const availableW = (camViewOn && !isMobile)
      ? (window.innerWidth - 80) / 2
      : Math.min(window.innerWidth - 32, 900);
    const availableH = availableW / (maxCols / maxRows) / 0.6 * 1.1;
    // Font scales inversely with cols: fewer chars = bigger font, same total size
    const fsByW = availableW / (cols * 0.6);
    const fsByH = availableH / (rows * 1.1);
    const fs    = Math.max(4, Math.min(fsByW, fsByH));
    output.style.fontSize = fs + 'px';
    output.style.width    = (cols * fs * 0.6) + 'px';
    output.style.height   = (rows * fs * 1.1) + 'px';
    document.body.style.overflow = '';
  }

  syncPanelSizes();
}

window.addEventListener('resize', syncPanelSizes);
placeholder.classList.add('hidden');