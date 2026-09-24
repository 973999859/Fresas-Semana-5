const URL = 'https://teachablemachine.withgoogle.com/models/lzr9KdndI/';

let model, webcam, labelContainer, maxPredictions;
let modelPromise = null;

async function ensureModel() {
  if (model) {
    return model;
  }

  if (!modelPromise) {
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';
    modelPromise = tmImage.load(modelURL, metadataURL).then((loadedModel) => {
      model = loadedModel;
      maxPredictions = model.getTotalClasses();
      setupLabels();
      return model;
    });
  }

  return modelPromise;
}

function setupLabels() {
  labelContainer = document.getElementById('label-container');
  labelContainer.innerHTML = '';
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement('div'));
  }
}

function getQualityComment(className, probability) {
  const name = className.toLowerCase();

  if (name.includes('buen') || name.includes('fresc') || name.includes('sano') || name.includes('apto')) {
    return 'La fresa está en buen estado para comer.';
  }

  if (name.includes('mal') || name.includes('podr') || name.includes('deterior') || name.includes('dañ')) {
    return 'La fresa está en mal estado para comer.';
  }

  if (name.includes('intermedia') || name.includes('regular') || name.includes('media') || name.includes('normal')) {
    return 'La fresa está en estado regular para comer.';
  }

  if (probability >= 0.7) {
    return 'La fresa está en buen estado para comer.';
  }

  if (probability >= 0.4) {
    return 'La fresa está en estado regular para comer.';
  }

  return 'La fresa está en mal estado para comer.';
}

function renderPrediction(prediction) {
  const sorted = prediction
    .slice()
    .sort((a, b) => b.probability - a.probability);

  const highest = sorted[0];
  const qualityComment = getQualityComment(highest.className, highest.probability);
  document.getElementById('prediction-count').textContent = `${(highest.probability * 100).toFixed(0)}%`;

  const resultState = document.getElementById('result-state');
  resultState.innerHTML = `
    <div class="result-orbit"><span></span></div>
    <h3>${highest.className}</h3>
    <p>Comentario: ${qualityComment}</p>
    <p>Confianza: ${(highest.probability * 100).toFixed(1)}%</p>
  `;

  for (let i = 0; i < maxPredictions; i++) {
    const item = sorted[i];
    const row = labelContainer.childNodes[i];
    row.innerHTML = `
      <div class="prediction-top">
        <strong>${item.className}</strong>
        <span>${(item.probability * 100).toFixed(1)}%</span>
      </div>
      <div class="meter"><i style="width: ${(item.probability * 100).toFixed(1)}%"></i></div>
    `;
  }
}

async function init() {
  await ensureModel();

  const flip = true;
  webcam = new tmImage.Webcam(200, 200, flip);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);

  document.getElementById('webcam-container').appendChild(webcam.canvas);
  document.getElementById('input-mode').textContent = 'Cámara';
  document.getElementById('preview-empty').hidden = true;
  document.getElementById('image-preview').hidden = true;
}

async function loop() {
  if (!webcam) return;
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !webcam) return;
  const prediction = await model.predict(webcam.canvas);
  renderPrediction(prediction);
}

async function classifyImage(imageElement) {
  await ensureModel();
  const prediction = await model.predict(imageElement);
  renderPrediction(prediction);
}

function displayImage(file) {
  if (!file) return;
  const fileReader = new FileReader();

  fileReader.onload = async function (event) {
    const imagePreview = document.getElementById('image-preview');
    const previewEmpty = document.getElementById('preview-empty');

    imagePreview.src = event.target.result;
    imagePreview.hidden = false;
    previewEmpty.hidden = true;
    document.getElementById('input-mode').textContent = 'Archivo';

    if (webcam) {
      webcam.stop();
      webcam.canvas.remove();
      webcam = null;
    }

    imagePreview.onload = async function () {
      await classifyImage(imagePreview);
    };
  };

  fileReader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const [file] = event.target.files;
      if (file) {
        displayImage(file);
      }
    });
  }
});