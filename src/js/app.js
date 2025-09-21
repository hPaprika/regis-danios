import { startScanner } from './scanner.js';
import { renderLuggageList, showMessage, initializeUI, openObservationModal } from './ui.js';
import { getAllRecords, getRecordsCount, clearAllRecords, deleteRecord, toggleCategory } from './store.js';
import { sendRecordsWithRetry } from './api.js';

// inicialización de la Applicación
document.addEventListener('DOMContentLoaded', () => {
    // Eliminar registros si han expirado (a las 23:59 del mismo día)
    try {
        const stored = localStorage.getItem('previewRecords');
        if (stored) {
            const obj = JSON.parse(stored);
            if (obj.expiresAt && Date.now() > obj.expiresAt) {
                localStorage.removeItem('previewRecords');
            }
        }
    } catch { }
    initialize();
});

function initialize() {
    const videoEl = document.getElementById('video');
    const scannerStatusEl = document.getElementById('scanner-status');

    initializeUI(handleListClick);
    renderLuggageList();
    window.renderLuggageList = renderLuggageList;
    startScanner(videoEl, scannerStatusEl);
    attachGlobalEventListeners();
}

function attachGlobalEventListeners() {
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');

    sendButton.addEventListener('click', handleSendRecords);
    clearButton.addEventListener('click', handleClearAll);
}

// Manejadores de Eventos
async function handleSendRecords() {
    const records = getAllRecords();
    if (records.length === 0) {
        showMessage('No hay registros para guardar', 'error');
        return;
    }

    const sendButton = document.getElementById('send-button');
    sendButton.disabled = true;
    sendButton.textContent = 'Guardando...';
    showMessage('Guardando registros...', 'info');

    try {
        // Guardar los registros en localStorage con timestamp y expiración a las 23:59
        const now = new Date();
        const expiresAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0).getTime();

        // Obtener registros previos
        let prev = [];
        try {
            const stored = localStorage.getItem('previewRecords');
            if (stored) {
                const obj = JSON.parse(stored);
                if (Array.isArray(obj.records)) {
                    prev = obj.records;
                }
            }
        } catch { }

        // Fusionar y mantener únicos por code
        const allRecords = [...prev, ...records];
        const uniqueRecords = Object.values(
            allRecords.reduce((acc, rec) => {
                acc[rec.code] = rec;
                return acc;
            }, {})
        );

        const dataToStore = {
            records: uniqueRecords,
            savedAt: now.getTime(),
            expiresAt
        };
        localStorage.setItem('previewRecords', JSON.stringify(dataToStore));

        const result = await sendRecordsWithRetry(records);
        if (result.success) {
            showMessage(`${result.recordsCount} registros guardados`, 'success');
            clearAllRecords();
            renderLuggageList();
        }
    } catch (error) {
        showMessage(`Error enviando datos: ${error.message}`, 'error');
    } finally {
        sendButton.disabled = false;
        renderLuggageList();
    }
}

function handleClearAll() {
    if (getRecordsCount() > 0) {
        clearAllRecords();
        renderLuggageList();
        showMessage('Lista vaciada', 'success');
    }
}

function handleListClick(e) {
    const target = e.target;
    const code = target.dataset.code;

    if (target.matches('.category-button:not(.obs-button)')) {
        const category = target.dataset.category;
        toggleCategory(code, category);
        target.classList.toggle('active');
    } else if (target.matches('.obs-button')) {
        openObservationModal(code);
    } else if (target.matches('.delete-luggage-button')) {
        renderLuggageList();
    }
}
