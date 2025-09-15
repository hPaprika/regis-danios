// Permitir cerrar la modal de usuario al hacer clic fuera
const userModalOverlay = document.getElementById('user-modal-overlay');
if (userModalOverlay) {
    userModalOverlay.addEventListener('click', (e) => {
        if (e.target === userModalOverlay) {
            userModalOverlay.style.display = 'none';
        }
    });
}

import { getAllRecords, getRecordsCount, saveObservation as saveObservationToStore, getRecord } from './store.js';

// Este sera inicializado por app.js
let handleListClickCallback;

// Gestion de Interfaz de Usuario
let luggageListEl = document.getElementById('luggage-list');
const headerEl = document.getElementById('luggage-header');
const sendButton = document.getElementById('send-button');
const clearButton = document.getElementById('clear-button');
const modalOverlay = document.getElementById('modal-overlay');
const modalAcceptButton = document.getElementById('modal-accept-button');
const observationTextarea = document.getElementById('observation-textarea');
const scannerStatusEl = document.getElementById('scanner-status');
const userName = document.getElementById("user-name")
const shift = document.getElementById("shift")
const date = document.getElementById("date")
let currentModalCode = null;

export function initializeUI(listClickCallback) {
    handleListClickCallback = listClickCallback;
    // Activar modal de usuario solo al hacer clic en #user-span
    const userSpan = document.getElementById('user-span');
    if (userSpan) {
        userSpan.addEventListener('click', () => {
            const userModalOverlay = document.getElementById('user-modal-overlay');
            const userInput = document.getElementById('user-input');
            const userAcceptButton = document.getElementById('user-accept-button');
            userModalOverlay.style.display = 'flex';
            userInput.value = '';
            userInput.focus();
            function acceptHandler() {
                const value = userInput.value.trim() || 'desconocido';
                localStorage.setItem('regis-danos-user', value);
                userModalOverlay.style.display = 'none';
                userAcceptButton.removeEventListener('click', acceptHandler);
                // Actualizar nombre en UI inmediatamente
                const userName = document.getElementById('user-name');
                if (userName) userName.textContent = value;
            }
            userAcceptButton.addEventListener('click', acceptHandler);
            userInput.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Enter') {
                    acceptHandler();
                    userInput.removeEventListener('keydown', onKey);
                }
            });
        });
    }
}

/**
 * Renderiza la lista de equipajes en la interfaz de usuario.
 */
export function renderLuggageList() {
    const records = getAllRecords();
    const currentUser = getCurrentUser();
    const shiftIn = records.length > 0 ? records[0].shift : '-';
    const dateIn = records.length > 0 ? records[0].dateTime.split(' ')[0] : new Date().toLocaleDateString();

    if (headerEl) {
        userName.textContent = currentUser;
        shift.textContent = `Turno: ${shiftIn}`;
        date.textContent = `Fecha: ${dateIn}`;
    }


    if (records.length === 0) {
        luggageListEl.innerHTML = '<li class="empty-message">No hay maletas escaneadas</li>';
    } else {
        const sortedRecords = records.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
        luggageListEl.innerHTML = sortedRecords.map(createLuggageItemHtml).join('');
    }

    updateSendButton();
    attachAllEventListeners();
}

/**
 * Crea la cadena HTML para un solo artículo de equipaje.
 * @param {object} record - El registro de equipaje.
 * @returns {string} La cadena HTML para el artículo.
 */

function createLuggageItemHtml(record) {
    const hasObservation = record.observation.length > 0;
    const time = record.dateTime.match(/\b(\d{2}:\d{2})\b/)?.[1] || '';

    return `
        <li class="luggage-item" data-code="${record.code}">
            <div class="luggage-header">
                <span class="luggage-code">${record.code}</span>
                <span class="luggage-time">${time}</span>
            </div>
            <div class="luggage-row-flex">
                <div class="categories-container">
                    ${['A', 'B', 'C'].map(cat => `
                        <button class="category-button ${record.categories[cat] ? 'active' : ''}" data-category="${cat}" data-code="${record.code}">${cat}</button>
                    `).join('')}
                    <button class="category-button obs-button ${hasObservation ? 'active' : ''}" data-code="${record.code}">OBS</button>
                </div>
                                <button class="delete-luggage-button" title="Eliminar maleta" data-code="${record.code}">
                                    <span class="delete-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="22" height="22"><path d="M136.7 5.9L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-8.7-26.1C306.9-7.2 294.7-16 280.9-16L167.1-16c-13.8 0-26 8.8-30.4 21.9zM416 144L32 144 53.1 467.1C54.7 492.4 75.7 512 101 512L347 512c25.3 0 46.3-19.6 47.9-44.9L416 144z"/></svg>
                                    </span>
                                </button>
            </div>
            ${hasObservation ? `<div class="observation-preview">${record.observation.substring(0, 50)}...</div>` : ''}
        </li>
    `;
}

/**
 * Actualiza el estado del botón de enviar según el conteo de registros.
 */
function updateSendButton() {
    const count = getRecordsCount();
    sendButton.disabled = count === 0;
    sendButton.textContent = `Enviar${count === 0 ? '' : ` (${count})`}`;
}

/**
 * Muestra una retroalimentación visual temporal en el elemento del escáner.
 * @param {'success' | 'error'} type - El tipo de retroalimentación.
 * @param {string} message - El mensaje a mostrar.
 */
export function showScanFeedback(type, message) {
    const container = document.getElementById('scanner-container');
    container.classList.add(type === 'success' ? 'flash-success' : 'flash-error');
    scannerStatusEl.textContent = message;

    setTimeout(() => {
        container.classList.remove('flash-success', 'flash-error');
        scannerStatusEl.textContent = '';
    }, 500);
}

/**
 * Muestra un mensaje al usuario.
 * @param {string} message - El mensaje a mostrar.
 * @param {'info' | 'success' | 'error'} type - El tipo de mensaje.
 */
export function showMessage(message, type = 'info') {
    scannerStatusEl.textContent = message;
    scannerStatusEl.className = `status-${type}`;
    setTimeout(() => {
        if (scannerStatusEl.textContent === message) {
            scannerStatusEl.textContent = '';
            scannerStatusEl.className = '';
        }
    }, 3000);
}

/**
 * Adjunta todos los event listeners necesarios a los elementos de la interfaz.
 */
function attachAllEventListeners() {
    const oldList = luggageListEl.cloneNode(true);
    luggageListEl.parentNode.replaceChild(oldList, luggageListEl);
    luggageListEl = oldList;

    luggageListEl.addEventListener('click', function (e) {
        const target = e.target.closest('.delete-luggage-button');
        if (target) {
            const code = target.dataset.code;
            // Elimina el registro sin confirmación
            import('./store.js').then(store => {
                store.deleteRecord(code);
                renderLuggageList();
            });
            return;
        }
        handleListClickCallback(e);
    });
    modalAcceptButton.onclick = saveObservation;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeObservationModal();
    };
}

function saveObservation() {
    if (!currentModalCode) return;
    const observation = observationTextarea.value.trim();
    saveObservationToStore(currentModalCode, observation);
    closeObservationModal();
    renderLuggageList();
}

export function openObservationModal(code) {
    currentModalCode = code;
    const record = getRecord(code);
    observationTextarea.value = record?.observation || '';
    modalOverlay.classList.add('active');
    setTimeout(() => observationTextarea.focus(), 100);
}

function closeObservationModal() {
    modalOverlay.classList.remove('active');
    currentModalCode = null;
}

// TODO: funcion repetida en store.js
// Considerar centralizar en un store.js o similar
function getCurrentUser() {
    let user = localStorage.getItem('regis-danos-user');
    if (!user) return null;
    return user;
}
