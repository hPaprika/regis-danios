
import { addRecord, hasRecord } from './store.js';
import { showScanFeedback, showMessage } from './ui.js';

// Logica del Scanner
const SCAN_DELAY_MS = 1000;
let isScanning = false;
let lastScanTime = 0;

/**
 * Inicializa y comienza el escáner de códigos ZXing.
 * @param {HTMLVideoElement} videoEl - El elemento de video que se utilizará para el escáner.
 * @param {HTMLElement} scannerStatusEl - El elemento para mostrar el estado del escáner.
 */
export async function startScanner(videoEl, scannerStatusEl) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } });
        videoEl.srcObject = stream;
        scannerStatusEl.textContent = `\u{1F4F7}`;

        const codeReader = new ZXing.BrowserMultiFormatReader();
        isScanning = true;

        codeReader.decodeFromVideoDevice(null, videoEl, (result, error) => {
            if (result && isScanning) {
                handleScannedCode(result.text);
            }
            if (error && !(error instanceof ZXing.NotFoundException)) {
                console.warn('Scanner error:', error);
            }
        });
    } catch (err) {
        scannerStatusEl.textContent = 'Error: No se pudo acceder a la cámara';
        console.error('Error starting scanner:', err);
    }
}

/**
 * Maneja un código escaneado, lo procesa y proporciona retroalimentación.
 * @param {string} rawCode - El código sin procesar del escáner.
 */
function handleScannedCode(rawCode) {
    const now = Date.now();
    if (now - lastScanTime < SCAN_DELAY_MS) return;

    const code = rawCode.replace(/\D/g, '').slice(-6);
    if (code.length < 6) {
        playBeep('error');
        showMessage('Código no válido', 'error');
        return;
    }

    lastScanTime = now;

    if (hasRecord(code)) {
        playBeep('error');
        showScanFeedback('error', `${code} \u{274E}`);
    } else {
        addRecord(code, getCurrentUser());
        playBeep('success');
        showScanFeedback('success', `${code} \u{2705}`);
        renderLuggageList();
    }
}

/**
 * Reproduce un sonido de beep para retroalimentación de éxito o error.
 * @param {'success' | 'error'} type - El tipo de sonido a reproducir.
 */
function playBeep(type = 'success') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        } else {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        }

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
        console.warn('No se puede reproducir Beep:', err);
    }
}

/**
 * Obtiene el nombre del usuario actual del almacenamiento local o de un aviso.
 * @returns {string} El nombre del usuario actual.
 */
function getCurrentUser() {
    let user = localStorage.getItem('regis-danos-user');
    return user || 'desconocido';
}
