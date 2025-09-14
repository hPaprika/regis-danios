/**
 * api.js - Comunicación con Google Apps Script
 */

class API {
  constructor() {
    // URL del endpoint de Google Apps Script - debe ser configurada
    this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3q_TLfSMWDylaAGbGmqU0L-B4k28Z4NVdQ3AIFddiqvc_9WRjdTkrnhhONw109ulu0Q/exec';
    this.TIMEOUT = 15000; // 15 segundos
  }

  /**
   * Configura la URL del Apps Script
   * @param {string} url - URL completa del endpoint
   */
  setEndpoint(url) {
    this.APPS_SCRIPT_URL = url;
  }

  /**
   * Envía registros a Google Sheets vía Apps Script
   * @param {Array} records - Array de registros formateados
   * @returns {Promise} - Promesa con resultado del envío
   */
  async sendRecords(records) {
    if (!records || records.length === 0) {
      throw new Error('No hay registros para enviar');
    }

    if (!this.APPS_SCRIPT_URL.includes('script.google.com')) {
      throw new Error('URL del Apps Script no configurada correctamente');
    }


    // Usar FormData para el envio de registros (como en un form HTML)
    const formData = new FormData();
    formData.append('action', 'addRecords');
    formData.append('records', JSON.stringify(records));
    formData.append('timestamp', new Date().toISOString());
    formData.append('source', 'regis-daños');

    try {
      console.log('Enviando registros (FormData):', formData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        // No headers, para evitar CORS con FormData
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      // Apps Script puede responder con JSON o texto
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      if (result && result.error) {
        throw new Error(result.error);
      }

      console.log('Respuesta del servidor:', result);
      return result;

    } catch (error) {
      console.error('Error enviando registros:', error);
      if (error.name === 'AbortError') {
        throw new Error('Timeout: El envío tardó más de lo esperado');
      }
      if (!navigator.onLine) {
        throw new Error('Sin conexión a internet');
      }

      throw error;
    }
  }

  /**
   * Valida que los registros tengan el formato correcto
   * @param {Array} records - Registros a validar
   * @returns {boolean} - true si son válidos
   */
  validateRecords(records) {
    if (!Array.isArray(records)) {
      return false;
    }

    return records.every(record => {
      return record.codigo &&
        record.fechaHora &&
        record.usuario &&
        record.turno &&
        typeof record.categorias === 'string' &&
        typeof record.observacion === 'string';
    });
  }

  /**
   * Prueba la conexión con el Apps Script
   * @returns {Promise} - Promesa con resultado de la prueba
   */
  async testConnection() {
    // Usar FormData para test de conexión
    const formData = new FormData();
    formData.append('action', 'ping');
    formData.append('timestamp', new Date().toISOString());

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s para ping

      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = await response.text();
        }
        return { success: true, data: result };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía registros con reintentos automáticos
   * @param {Array} records - Registros a enviar
   * @param {number} maxRetries - Número máximo de reintentos
   * @returns {Promise} - Resultado del envío
   */
  async sendRecordsWithRetry(records, maxRetries = 3) {
    if (!this.validateRecords(records)) {
      throw new Error('Formato de registros inválido');
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendRecords(records);

        // Si llegamos aquí, el envío fue exitoso
        return {
          success: true,
          data: result,
          attempt: attempt,
          recordsCount: records.length
        };

      } catch (error) {
        lastError = error;
        console.warn(`Intento ${attempt}/${maxRetries} falló:`, error.message);

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          await this.wait(1000 * attempt); // Backoff progresivo
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw new Error(`Error tras ${maxRetries} intentos: ${lastError.message}`);
  }

  /**
   * Función helper para esperar
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise} - Promesa que se resuelve después del delay
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene información del estado de la conexión
   * @returns {Object} - Estado de la conexión
   */
  getConnectionInfo() {
    return {
      online: navigator.onLine,
      endpoint: this.APPS_SCRIPT_URL,
      timeout: this.TIMEOUT,
      configured: this.APPS_SCRIPT_URL.includes('script.google.com') &&
        !this.APPS_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbzTx3O2OGHhX9Z035zmNYWO2Yi4L4IoRWunQ22gJhuVDmo_Z-GyJaT4dWQRxpPmsiXlsA/exec')
    };
  }
}

export default API;