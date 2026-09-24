const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/acj_H8Np2/';

let model;
let webcam;
let animationFrame;
let classCount = 0;

const elements = {
  status: document.getElementById('model-status'),
  cameraButton: document.getElementById('camera-button'),
  fileInput: document.getElementById('file-input'),
  stopCamera: document.getElementById('stop-camera'),
  empty: document.getElementById('preview-empty'),
  webcam: document.getElementById('webcam-container'),
  preview: document.getElementById('image-preview'),
  scan: document.getElementById('scan-line'),
  mode: document.getElementById('input-mode'),
  state: document.getElementById('result-state'),
  labels: document.getElementById('label-container'),
  count: document.getElementById('prediction-count'),
};

async function loadModel() {
  elements.status.textContent = 'Cargando modelo...';
  try {
    model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
    classCount = model.getTotalClasses();
    elements.status.textContent = 'Modelo listo para analizar';
  } catch (error) {
    elements.status.textContent = 'No se pudo cargar el modelo';
    elements.status.parentElement.classList.add('error');
    elements.state.innerHTML = '<h3>Modelo no disponible</h3><p>Comprueba tu conexión y vuelve a cargar la página.</p>';
    console.error('Error loading Teachable Machine model:', error);
  }
}

async function startCamera() {
  if (!model) return;
  stopCamera();
  try {
    webcam = new tmImage.Webcam(480, 360, true);
    await webcam.setup();
    await webcam.play();
    elements.empty.hidden = true;
    elements.preview.hidden = true;
    elements.webcam.hidden = false;
    elements.scan.hidden = false;
    elements.cameraButton.hidden = true;
    elements.stopCamera.hidden = false;
    elements.mode.textContent = 'Cámara activa';
    updateCameraFrame();
  } catch (error) {
    elements.status.textContent = 'Permiso de cámara necesario';
    elements.state.innerHTML = '<h3>No se pudo abrir la cámara</h3><p>Concede permiso o sube una imagen para continuar.</p>';
    console.error('Camera error:', error);
  }
}

function updateCameraFrame() {
  if (!webcam) return;
  webcam.update();
  predict(webcam.canvas);
  animationFrame = window.requestAnimationFrame(updateCameraFrame);
}

function stopCamera() {
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  if (webcam) webcam.stop();
  webcam = null;
  elements.webcam.hidden = true;
  elements.scan.hidden = true;
  elements.cameraButton.hidden = false;
  elements.stopCamera.hidden = true;
}

function handleFile(event) {
  const [file] = event.target.files;
  if (!file) return;
  stopCamera();
  const reader = new FileReader();
  reader.onload = () => {
    elements.preview.src = reader.result;
    elements.preview.hidden = false;
    elements.empty.hidden = true;
    elements.mode.textContent = 'Imagen cargada';
    elements.scan.hidden = false;
    elements.preview.onload = () => predict(elements.preview);
  };
  reader.readAsDataURL(file);
}

async function predict(source) {
  if (!model || !source) return;
  const predictions = await model.predict(source);
  predictions.sort((first, second) => second.probability - first.probability);
  elements.state.hidden = true;
  elements.count.textContent = `${Math.round(predictions[0].probability * 100)}%`;
  elements.labels.innerHTML = predictions.map((prediction) => {
    const percentage = Math.round(prediction.probability * 100);
    return `<div class="prediction"><div class="prediction-top"><strong>${prediction.className}</strong><span>${percentage}%</span></div><div class="meter"><i style="width: ${percentage}%"></i></div></div>`;
  }).join('');
}

elements.cameraButton.addEventListener('click', startCamera);
elements.stopCamera.addEventListener('click', stopCamera);
elements.fileInput.addEventListener('change', handleFile);
loadModel();