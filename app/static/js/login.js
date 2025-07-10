const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const errorMessage = document.getElementById('errorMessage');
const progressCanvas = document.getElementById('progressCanvas');
const ctx = progressCanvas.getContext('2d');
let camera = null;
let faceMesh = null;
let faceFound = false;
let stableTimer = null;
let countdown = 3;
let progress = 0;
let progressAnim = null;
let ws = null;
let sending = false;

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
    showMessage("Coloca tu rostro dentro del marco y mantente quieto para iniciar sesión.", "#b3c6e0");
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
        await faceMesh.send({ image: video });
    },
    width: 660,
    height: 480
});

    enableCameraFlow();
    camera.start();
});

function onResults(results) {
    if (sending) return;

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
                    showMessage("¡Iniciando autenticación en vivo!", "#34eb77");
                    stopProgressAnimation();
                    startWebSocket();
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

function startWebSocket() {
    ws = new WebSocket("/api/authentication/ws/login/1");
    ws.onopen = () => {
        sending = true;
        sendFrames();
        showMessage("Autenticando... Mantente frente a la cámara.", "#b3c6e0");
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.successful) {
            showMessage("¡Autenticación exitosa!", "#34eb77");
            sending = false;
            ws.close();
            if (camera) camera.stop();
        } else if (data.error) {
            if (data.error.includes("no hay un usuario registrado")) {
            showMessage(data.error, "#ff6b6b");
            sending = false;
            ws.close();
            startBtn.style.display = "";
            startBtn.disabled = false;
            startBtn.textContent = "Reintentar";
            } else {
                showMessage("Buscando rostro...", "#ff6b6b");
            }
        }
    };
    ws.onerror = () => {
        showMessage("Error de conexión con el servidor.", "#ff6b6b");
        sending = false;
        console.log("Ocurrio un error")
        ws.close();
        startBtn.style.display = "";
        startBtn.disabled = false;
        startBtn.textContent = "Reintentar";
    };
    ws.onclose = () => {
        sending = false;
    };
}

async function sendFrames() {
    while (sending && ws && ws.readyState === 1) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        ws.send(JSON.stringify({ image: dataURL }));
        await new Promise(r => setTimeout(r, 500)); // cada 500ms
    }
}
window.addEventListener('beforeunload', () => {
    if (camera) camera.stop();
    stopProgressAnimation();
    if (ws) ws.close();
});