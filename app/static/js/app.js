const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const errorMessage = document.getElementById('errorMessage');
const progressCanvas = document.getElementById('progressCanvas');
const ctx = progressCanvas.getContext('2d');
const capturedPhoto = document.getElementById('capturedPhoto');
const actionButtons = document.getElementById('actionButtons');
const confirmBtn = document.getElementById('confirmBtn');
const retakeBtn = document.getElementById('retakeBtn');

let camera = null;
let faceMesh = null;
let faceFound = false;
let stableTimer = null;
let countdown = 3;
let progress = 0;
let progressAnim = null;
let photoTaken = false;

function showMessage(msg, color = "#6ec6ff") {
    errorMessage.textContent = msg;
    errorMessage.style.color = color;
}

function resizeCanvas() {
    progressCanvas.width = video.videoWidth;
    progressCanvas.height = video.videoHeight;
}

video.addEventListener('loadedmetadata', resizeCanvas);

function drawProgressCircle(progress) {
    ctx.clearRect(0, 0, progressCanvas.width, progressCanvas.height);
    const centerX = progressCanvas.width / 2;
    const centerY = progressCanvas.height / 2;
    const radius = Math.min(progressCanvas.width, progressCanvas.height) * 0.4;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#b3c6e055";
    ctx.lineWidth = 10;
    ctx.stroke();

    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.strokeStyle = "#34eb77";
        ctx.lineWidth = 10;
        ctx.shadowColor = "#34eb7799";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function startProgressAnimation() {
    progress = 0;
    drawProgressCircle(0);
    let start = null;

    function animateProgress(ts) {
        if (!start) start = ts;
        const elapsed = (ts - start) / 1000;
        progress = Math.min(elapsed / 3, 1);
        drawProgressCircle(progress);

        if (progress < 1) {
            progressAnim = requestAnimationFrame(animateProgress);
        } else {
            drawProgressCircle(1);
        }
    }
    progressAnim = requestAnimationFrame(animateProgress);
}

function stopProgressAnimation() {
    if (progressAnim) cancelAnimationFrame(progressAnim);
    drawProgressCircle(0);
}

function enableCameraFlow() {
    video.style.display = "";
    capturedPhoto.style.display = "none";
    actionButtons.style.display = "none";
    showMessage("Coloca tu rostro dentro del marco y mantente quieto para tomar la foto.", "#b3c6e0");
    photoTaken = false;
    faceFound = false;
    startBtn.style.display = "none";
    if (camera) camera.start();
}

startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Cargando cámara...';
    showMessage("Inicializando el detector de rostro...", "#b3c6e0");

    faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    camera = new Camera(video, {
        onFrame: async () => {
            if (!photoTaken) await faceMesh.send({ image: video });
        },
        width: 320,
        height: 240
    });

    enableCameraFlow();
    camera.start();
});

function onResults(results) {
    if (photoTaken) return;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        if (!faceFound) {
            faceFound = true;
            countdown = 3;
            showMessage(`¡Rostro detectado! Mantente quieto durante ${countdown} segundos...`);
            startProgressAnimation();

            stableTimer = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showMessage(`¡Rostro detectado! Mantente quieto durante ${countdown} segundos...`);
                } else {
                    clearInterval(stableTimer);
                    faceFound = false;
                    showMessage("¡Foto tomada correctamente! ¿Te gusta cómo quedó?", "#34eb77");
                    stopProgressAnimation();
                    captureFace();
                }
            }, 1000);
        }
    } else {
        if (faceFound) {
            clearInterval(stableTimer);
            showMessage("¡Te moviste! Vuelve a ponerte frente a la cámara.", "#ff6b6b");
            stopProgressAnimation();
            faceFound = false;
        }
    }
}

function captureFace() {
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        setTimeout(captureFace, 100);
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedPhoto.src = canvas.toDataURL('image/png');
    capturedPhoto.style.display = "";
    video.style.display = "none";
    actionButtons.style.display = "flex";
    photoTaken = true;
}

retakeBtn.addEventListener('click', () => {
    enableCameraFlow();
});

confirmBtn.addEventListener('click', () => {
    showMessage("¡Foto confirmada! Puedes continuar con el proceso.", "#34eb77");
    actionButtons.style.display = "none";
});
window.addEventListener('beforeunload', () => {
    if (camera) camera.stop();
    stopProgressAnimation();
});