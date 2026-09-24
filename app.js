const URL = 'https://teachablemachine.withgoogle.com/models/lzr9KdndI/';

let model;
let webcam;
let labelContainer;
let maxPredictions;
let animationFrameId;

const elements = {
  status: document.getElementById('model-status'),
  webcam: document.getElementById('webcam-container'),
  imagePreview: document.getElementById('image-preview'),
  empty: document.getElementById('preview-empty'),
  scan: document.getElementById('scan-line'),
  mode: document.getElementById('input-mode'),
  state: document.getElementById('result-state'),
  labels: document.getElementById('label-container'),
  count: document.getElementById('prediction-count'),
  fileInput: document.getElementById('file-input'),
};

function stopWebcam() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (webcam) {
    webcam.stop();
    webcam = null;
  }

  if (elements.webcam) {
    elements.webcam.innerHTML = '';
  }
}

function renderPredictions(prediction) {
  const sortedPrediction = [...prediction].sort((a, b) => b.probability - a.probability);
  const top = sortedPrediction[0];
  const percent = (top.probability * 100).toFixed(1);

  elements.count.textContent = `${percent}%`;
  elements.labels.innerHTML = sortedPrediction.map((item) => {
    const probability = (item.probability * 100).toFixed(1);
    return `
      <div class="prediction">
        <div class="prediction-top">
          <strong>${item.className}</strong>
          <span>${probability}%</span>
        </div>
        <div class="meter">
          <i style="width: ${probability}%"></i>
        </div>
      </div>
    `;
  }).join('');

  if (elements.state) {
    elements.state.innerHTML = `
      <div class="result-orbit"><span></span></div>
      <h3>${top.className}</h3>
      <p>Confianza: ${percent}%</p>
    `;
  }
}

async function init() {
  const isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (!isSecureContext) {
    elements.status.textContent = 'Abre la app desde http://localhost:8000 o HTTPS';
    if (elements.state) {
      elements.state.innerHTML = '<h3>Servidor necesario</h3><p>Chrome exige abrir la aplicación desde localhost o HTTPS para usar la cámara y el modelo.</p>';
    }
    return;
  }

  if (!window.tmImage) {
    elements.status.textContent = 'No se cargó Teachable Machine';
    return;
  }

  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';

  try {
    if (!model) {
      elements.status.textContent = 'Cargando modelo...';
      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
    }

    stopWebcam();
    const flip = true;
    webcam = new tmImage.Webcam(320, 240, flip);
    await webcam.setup();
    await webcam.play();

    elements.empty.style.display = 'none';
    if (elements.imagePreview) elements.imagePreview.hidden = true;
    elements.scan.style.display = 'block';
    elements.mode.textContent = 'Cámara activa';
    elements.webcam.innerHTML = '';
    elements.webcam.appendChild(webcam.canvas);

    labelContainer = document.getElementById('label-container');
    labelContainer.innerHTML = '';
    for (let i = 0; i < maxPredictions; i++) {
      const row = document.createElement('div');
      row.className = 'prediction';
      labelContainer.appendChild(row);
    }

    elements.status.textContent = 'Modelo listo';
    animationFrameId = requestAnimationFrame(loop);
  } catch (error) {
    elements.status.textContent = 'No se pudo cargar el modelo';
    console.error(error);
    if (elements.state) {
      elements.state.innerHTML = '<h3>Modelo no disponible</h3><p>Verifica la conexión y vuelve a intentar.</p>';
    }
  }
}

async function loop() {
  if (!webcam) return;
  webcam.update();
  await predict();
  animationFrameId = requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !webcam || !labelContainer) return;
  const prediction = await model.predict(webcam.canvas);
  renderPredictions(prediction);
}

async function handleFile(event) {
  const [file] = event.target.files;
  if (!file) return;

  stopWebcam();

  const reader = new FileReader();
  reader.onload = async () => {
    elements.imagePreview.src = reader.result;
    elements.imagePreview.hidden = false;
    elements.empty.style.display = 'none';
    elements.scan.style.display = 'block';
    elements.mode.textContent = 'Imagen cargada';

    if (!model) {
      elements.status.textContent = 'Cargando modelo...';
      model = await tmImage.load(URL + 'model.json', URL + 'metadata.json');
      maxPredictions = model.getTotalClasses();
      elements.status.textContent = 'Modelo listo';
    }

    const predictions = await model.predict(elements.imagePreview);
    renderPredictions(predictions);
  };
  reader.readAsDataURL(file);
}

if (elements.fileInput) {
  elements.fileInput.addEventListener('change', handleFile);
}

if (elements.status) {
  elements.status.textContent = 'Modelo listo para cargar';
}