const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/3aA_M8vve/';

const emojis = {
    'One':   '1️⃣',
    'Two':   '2️⃣',
    'Three': '3️⃣',
    'Four':  '4️⃣',
    'Five':  '5️⃣'
};

let model = null;
let webcam = null;
let isRunning = false;
let animationId = null;

const btn = document.getElementById('btn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const topResultEl = document.getElementById('top-result');
const webcamContainer = document.getElementById('webcam-container');

async function loadModel() {
    statusEl.textContent = 'Loading model...';
    btn.disabled = true;

    try {
        const modelURL = MODEL_URL + 'model.json';
        const metadataURL = MODEL_URL + 'metadata.json';
        model = await tmImage.load(modelURL, metadataURL);
        buildResultBars(model.getClassLabels());
        statusEl.textContent = '';
        btn.disabled = false;
    } catch (err) {
        statusEl.textContent = 'Error loading model: ' + err.message;
        statusEl.style.color = '#e53e3e';
        console.error(err);
    }
}

function buildResultBars(labels) {
    resultsEl.innerHTML = '';
    labels.forEach(label => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-label">
                <span>${emojis[label] || '🔲'} ${label}</span>
                <span id="score-${label}">0%</span>
            </div>
            <div class="bar-bg">
                <div class="bar-fill" id="bar-${label}"></div>
            </div>
        `;
        resultsEl.appendChild(item);
    });
}

async function toggleCamera() {
    if (!model) return;

    if (isRunning) {
        // Stop
        isRunning = false;
        cancelAnimationFrame(animationId);
        webcam.stop();
        webcamContainer.innerHTML = '';
        btn.textContent = 'Start Camera';
        topResultEl.textContent = '';

        // Reset bars
        model.getClassLabels().forEach(label => {
            const bar = document.getElementById('bar-' + label);
            const scoreEl = document.getElementById('score-' + label);
            if (bar) { bar.style.width = '0%'; bar.className = 'bar-fill'; }
            if (scoreEl) scoreEl.textContent = '0%';
        });

    } else {
        // Start
        try {
            statusEl.textContent = 'Starting camera...';
            statusEl.style.color = '#4f46e5';

            webcam = new tmImage.Webcam(300, 300, true); // width, height, flip
            await webcam.setup();
            await webcam.play();

            webcamContainer.appendChild(webcam.canvas);

            isRunning = true;
            btn.textContent = 'Stop Camera';
            statusEl.textContent = '';
            topResultEl.textContent = '📷 Scanning...';

            loop();
        } catch (err) {
            statusEl.textContent = 'Camera error: ' + err.message;
            statusEl.style.color = '#e53e3e';
            console.error(err);
        }
    }
}

async function loop() {
    if (!isRunning) return;
    webcam.update();
    await predict();
    animationId = requestAnimationFrame(loop);
}

async function predict() {
    const predictions = await model.predict(webcam.canvas);

    let maxScore = -1;
    let topLabel = '';

    predictions.forEach(p => {
        if (p.probability > maxScore) {
            maxScore = p.probability;
            topLabel = p.className;
        }
    });

    topResultEl.textContent = `${emojis[topLabel] || '🔲'} ${topLabel}`;

    predictions.forEach(p => {
        const pct = Math.round(p.probability * 100);
        const bar = document.getElementById('bar-' + p.className);
        const scoreEl = document.getElementById('score-' + p.className);
        if (bar) {
            bar.style.width = pct + '%';
            bar.className = 'bar-fill' + (p.className === topLabel ? ' top' : '');
        }
        if (scoreEl) scoreEl.textContent = pct + '%';
    });
}

// Load model on page open
loadModel();
