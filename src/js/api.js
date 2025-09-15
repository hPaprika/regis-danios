// Comunicación con la API
const API_URL = 'https://script.google.com/macros/s/AKfycbw3q_TLfSMWDylaAGbGmqU0L-B4k28Z4NVdQ3AIFddiqvc_9WRjdTkrnhhONw109ulu0Q/exec';
const API_TIMEOUT_MS = 15000;

/**
 * Envía registros al punto de acceso de Google Apps Script con un mecanismo de reintento.
 * @param {Array<object>} records - El array de registros a enviar.
 * @param {number} maxRetries - El número máximo de intentos de reintento.
 * @returns {Promise<object>} El resultado de la operación de envío.
 */
export async function sendRecordsWithRetry(records, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('action', 'addRecords');
      formData.append('records', JSON.stringify(records.map(formatRecordForApi)));
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'regis-daños');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const result = await response.json();
      if (result && result.error) throw new Error(result.error);

      return { success: true, data: result, attempt, recordsCount: records.length };

    } catch (error) {
      lastError = error;
      console.warn(`Intento ${attempt}/${maxRetries} fallido:`, error.message);
      if (attempt < maxRetries) await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
  throw new Error(`Error after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Formatea un objeto de registro para la carga útil de la API.
 * @param {object} record - El registro de equipaje.
 * @returns {object} El registro formateado.
 */
function formatRecordForApi(record) {
  return {
    code: record.code,
    categories: Object.entries(record.categories).filter(([, v]) => v).map(([k]) => k).join(', '),
    observation: record.observation,
    dateTime: record.dateTime,
    user: record.user,
    shift: record.shift,
  };
}
