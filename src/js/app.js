import { startScanner } from './scanner.js';
import { renderLuggageList, showMessage, initializeUI, openObservationModal } from './ui.js';
import { getAllRecords, getRecordsCount, clearAllRecords, deleteRecord, toggleCategory } from './store.js';
import { sendRecordsWithRetry } from './api.js';

// inicialización de la Applicación
document.addEventListener('DOMContentLoaded', () => {
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
        showMessage('No hay registros para enviar', 'error');
        return;
    }

    const sendButton = document.getElementById('send-button');
    sendButton.disabled = true;
    sendButton.textContent = 'Enviando...';
    showMessage('Enviando registros al servidor...', 'info');

    try {
        const result = await sendRecordsWithRetry(records);
        if (result.success) {
            showMessage(`${result.recordsCount} registros enviados correctamente`, 'success');
            clearAllRecords();
            renderLuggageList();
        }
    } catch (error) {
        showMessage(`Error enviando datos: ${error.message}`, 'error');
    } finally {
        sendButton.disabled = false;
        renderLuggageList(); // Para actualizar el texto del botón
    }
}

function handleClearAll() {
    if (getRecordsCount() > 0 && confirm(`¿Estás seguro de vaciar ${getRecordsCount()} registros?`)) {
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
        if (confirm('¿Eliminar este registro?')) {
            deleteRecord(code);
            renderLuggageList();
        }
    }
}
