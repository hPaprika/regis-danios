// Gestion de Almacenamiento en Memoria
const luggageRecords = new Map();

/**
 * Agrega un nuevo registro de equipaje al mapa en memoria.
 * @param {string} code - El código de equipaje de 6 dígitos.
 * @param {string} user - El nombre del operador.
 */
export function addRecord(code, user = 'desconocido') {
    const now = new Date();
    const record = {
        code,
        categories: { A: false, B: false, C: false },
        observation: '',
        isoDate: now.toISOString(),
        dateTime: formatDateTime(now),
        user,
        shift: calculateShift(now),
    };
    luggageRecords.set(code, record);
}

/**
 * Alterna una categoría de daño para un registro de equipaje específico.
 * @param {string} code - El código de equipaje.
 * @param {string} category - La categoría a alternar (A, B o C).
 */
export function toggleCategory(code, category) {
    const record = luggageRecords.get(code);
    if (record) {
        record.categories[category] = !record.categories[category];
    }
}

/**
 * Guarda el texto de observación para un registro de equipaje.
 * @param {string} code - El código de equipaje.
 * @param {string} observation - El texto de observación.
 */
export function saveObservation(code, observation) {
    const record = luggageRecords.get(code);
    if (record) {
        record.observation = observation;
    }
}

/**
 * Obtiene un registro de equipaje específico por su código.
 * @param {string} code - El código de equipaje.
 * @returns {object | undefined} El registro, o undefined si no se encuentra.
 */
export function getRecord(code) {
    return luggageRecords.get(code);
}

/**
 * Obtiene todos los registros de equipaje como un array.
 * @returns {Array<object>} Un array de todos los registros.
 */
export function getAllRecords() {
    return Array.from(luggageRecords.values());
}

/**
 * Limpia todos los registros de la tienda.
 */
export function clearAllRecords() {
    luggageRecords.clear();
}

/**
 * Elimina un registro de la tienda.
 * @param {string} code - El código de equipaje.
 */
export function deleteRecord(code) {
    luggageRecords.delete(code);
}

/**
 * Obtiene el número total de registros en la tienda.
 * @returns {number} El número de registros.
 */
export function getRecordsCount() {
    return luggageRecords.size;
}

/**
 * Verifica si un registro con el código dado ya existe.
 * @param {string} code - El código de equipaje.
 * @returns {boolean} Verdadero si el registro existe, falso en caso contrario.
 */
export function hasRecord(code) {
    return luggageRecords.has(code);
}

// Funciones de Utilidad
/**
 * Calcula el turno de trabajo basado en la hora actual.
 * @param {Date} date - El objeto de fecha.
 * @returns {string} El nombre del turno calculado.
 */
function calculateShift(date) {
    const hour = date.getHours();
    return (hour >= 4 && hour <= 12) ? 'BRC-ERC' : 'IRC-KRC';
}

/**
 * Formatea un objeto Date en una cadena 'dd/mm/yyyy HH:mm'.
 * @param {Date} date - La fecha a formatear.
 * @returns {string} La cadena de fecha formateada.
 */
function formatDateTime(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
