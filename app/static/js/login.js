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
let sendInterval = null;
const SEND_INTERVAL = 2000;
const MAX_RECONNECT_ATTEMPTS = 3;
let reconnectAttempts = 0;
let authenticated = false;

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
    stopProgressAnimation()
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
    ctx.clearRect(0, 0, progressCanvas.width, progressCanvas.height);
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
        width: 640,
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
    if (authenticated) {
        return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }

    ws = new WebSocket(`ws://${window.location.host}/api/authentication/ws/login/2`);

    ws.onopen = () => {
        if(authenticated){
            ws.close();
            return;
        }
        console.log("WebSocket conectado");
        sending = true;
        reconnectAttempts = 0;
        setTimeout(() => {
            startSendingFrames();
         }, 100);
        showMessage("Autenticando... Mantente frente a la cámara.", "#34eb77");
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("Mensaje recibido:", data);
            if (data.successful) {
                showMessage("¡Autenticación exitosa!", "#34eb77");
                authenticated = true;
                if(data.id_user){
                    localStorage.setItem("id-data-user", data.id_user);
                }
                cleanupWebSocket();
                console.log("autneticado")
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 20);

            } else if (data.error) {
                console.error("Error:", data.error);
                if (data.error.includes("no hay un usuario registrado")) {
                    showMessage(data.error, "#ff6b6b");
                    cleanupWebSocket();
                    resetToStart();
                } else {
                    showMessage("Analizando rostro...", "#ffa500");
                }
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        showMessage("Error de conexión con el servidor.", "#ff6b6b");
        handleWebSocketError();
    };

    ws.onclose = (event) => {
        console.log("WebSocket cerrado:", event.code, event.reason);
        ws = null;
        cleanupWebSocket();
        if (!authenticated) {
            if (event.code === 1006 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                showMessage(`Reconectando... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, "#ffa500");
                setTimeout(() => startWebSocket(), 2000);
            } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                showMessage("No se pudo conectar. Reinicia el proceso.", "#ff6b6b");
                resetToStart();
            }
        }
    };
}
function startSendingFrames() {
    sendInterval = setInterval(() => {
        if (!sending || !ws || ws.readyState !== WebSocket.OPEN) {
            stopSendingFrames();
            return;
        }
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (canvas.width === 0 || canvas.height === 0) {
                console.log("Video no listo aún");
                return;
            }
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            if (dataURL && dataURL.startsWith('data:image/')) {
                ws.send(JSON.stringify({ image: dataURL }));
                console.log("Frame enviado exitosamente");
            } else {
                console.log("DataURL inválido, saltando frame");
            }

        } catch (error) {
            console.error("Error capturing frame:", error);
        }
    }, SEND_INTERVAL);
}

function stopSendingFrames() {
    if (sendInterval) {
        clearInterval(sendInterval);
        sendInterval = null;
    }
}

function cleanupWebSocket() {
    sending = false;
    stopSendingFrames();
    if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
    }
}

function resetToStart() {
    startBtn.style.display = "";
    startBtn.disabled = false;
    startBtn.textContent = "Iniciar Sesión";
    if (camera) camera.stop();
}

function handleWebSocketError() {
    cleanupWebSocket();
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => startWebSocket(), 2000);
    } else {
        resetToStart();
    }
}
window.addEventListener('beforeunload', () => {
    cleanupWebSocket();
    if (camera) camera.stop();
    stopProgressAnimation();
});