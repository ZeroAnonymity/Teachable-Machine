const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/kWBewVXKO/';

const emojis = {
    'Background Noise': '🔇',
    'Cat': '🐱',
    'Cow': '🐄',
    'Duck': '🦆',
    'Goat': '🐐',
    'Snake': '🐍'
};

let recognizer = null;
let isListening = false;

const btn = document.getElementById('btn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const topResultEl = document.getElementById('top-result');

async function loadModel() {
    statusEl.textContent = 'Loading model...';
    statusEl.style.color = '#4f46e5';
    btn.disabled = true;

    try {
        recognizer = speechCommands.create(
            'BROWSER_FFT',
            undefined,
            MODEL_URL + 'model.json',
            MODEL_URL + 'metadata.json'
        );
        await recognizer.ensureModelLoaded();
        statusEl.textContent = '';
        btn.disabled = false;
        buildResultBars(recognizer.wordLabels());
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
                <span>${emojis[label] || '🔊'} ${label}</span>
                <span id="score-${label}">0%</span>
            </div>
            <div class="bar-bg">
                <div class="bar-fill" id="bar-${label}"></div>
            </div>
        `;
        resultsEl.appendChild(item);
    });
}

async function toggleListening() {
    if (!recognizer) return;

    if (isListening) {
        await recognizer.stopListening();
        isListening = false;
        btn.textContent = 'Start Listening';
        topResultEl.textContent = '';
    } else {
        try {
            await recognizer.listen(result => {
                const scores = result.scores;
                const labels = recognizer.wordLabels();

                let maxScore = -1;
                let topLabel = '';
                labels.forEach((label, i) => {
                    if (scores[i] > maxScore) {
                        maxScore = scores[i];
                        topLabel = label;
                    }
                });

                if (topLabel !== 'Background Noise') {
                    topResultEl.textContent = `${emojis[topLabel] || '🔊'} ${topLabel}`;
                } else {
                    topResultEl.textContent = '🎧 Listening...';
                }

                labels.forEach((label, i) => {
                    const pct = Math.round(scores[i] * 100);
                    const bar = document.getElementById('bar-' + label);
                    const scoreEl = document.getElementById('score-' + label);
                    if (bar) {
                        bar.style.width = pct + '%';
                        bar.className = 'bar-fill' + (label === topLabel ? ' top' : '');
                    }
                    if (scoreEl) scoreEl.textContent = pct + '%';
                });

            }, {
                probabilityThreshold: 0.75,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.50
            });

            isListening = true;
            btn.textContent = 'Stop Listening';
            topResultEl.textContent = '🎧 Listening...';

        } catch (err) {
            statusEl.textContent = 'Microphone error: ' + err.message;
            statusEl.style.color = '#e53e3e';
            console.error(err);
        }
    }
}

// Load model on page open
loadModel();
