/**
 * api.js - Comunicación con Google Apps Script
 */

class API {
  constructor() {
    // URL del endpoint de Google Apps Script - debe ser configurada
    this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztQIdBekeVnEtpgBZYRLChmY1s2Ay4iY4jHr0CSFNTf3jMMJaJzEzqdgCrePmzsm2rhw/exec';
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

    const payload = {
      action: 'addRecords',
      records: records,
      timestamp: new Date().toISOString(),
      source: 'regis-daños'
    };

    try {
      console.log('Enviando registros:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
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
    const testPayload = {
      action: 'ping',
      timestamp: new Date().toISOString()
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s para ping

      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
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
                  !this.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')
    };
  }
}

export default API;