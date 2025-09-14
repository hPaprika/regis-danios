/**
 * app.js - Punto de entrada y coordinador principal de la aplicación
 */

import Scanner from './scanner.js';
import Storage from './storage.js';
import UI from './ui.js';
import API from './api.js';

class MaletasApp {
  constructor() {
    this.scanner = new Scanner();
    this.storage = new Storage();
    this.ui = new UI(this.storage);
    this.api = new API();
    
    this.isInitialized = false;
    this.isSending = false;
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    try {
      console.log('Inicializando Maletas PWA...');
      
      // Configurar callbacks de UI
      this.ui.setCallbacks(
        this.onCategoryChange.bind(this),
        this.onObservationChange.bind(this)
      );
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Inicializar escáner
      await this.initializeScanner();
      
      // Renderizar UI inicial
      this.ui.renderMaletasList();
      
      // Configurar endpoint de API (en producción debe venir de config)
      this.configureAPI();
      
      this.isInitialized = true;
      console.log('Aplicación inicializada correctamente');
      
    } catch (error) {
      console.error('Error inicializando aplicación:', error);
      this.ui.showMessage('Error al inicializar la aplicación', 'error');
    }
  }

  /**
   * Configura los event listeners principales
   */
  setupEventListeners() {
    // Botón enviar registros
    const btnEnviar = document.getElementById('btn-enviar');
    btnEnviar.addEventListener('click', () => {
      this.handleSendRecords();
    });

    // Botón vaciar todo
    const btnVaciar = document.getElementById('btn-vaciar');
    btnVaciar.addEventListener('click', () => {
      this.handleClearAll();
    });

    // Cambios en el input de usuario
    const userInput = document.getElementById('usuario-input');
    userInput.addEventListener('change', () => {
      console.log('Usuario actualizado:', userInput.value);
    });

    // Detectar pérdida de foco en la aplicación (para pausar escáner si es necesario)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App en background');
      } else {
        console.log('App en foreground');
      }
    });
  }

  /**
   * Inicializa el escáner de códigos
   */
  async initializeScanner() {
    const video = document.getElementById('video');
    
    await this.scanner.startScanner(
      video,
      this.onCodeScanned.bind(this),      // Código válido (nuevo)
      this.onDuplicateCode.bind(this),    // Código duplicado
      this.onScanError.bind(this)         // Error en escaneo
    );
  }

  /**
   * Configura la URL del API
   */
  configureAPI() {
    // En producción, esta URL debería venir de una variable de entorno
    // o archivo de configuración
    const apiUrl = process.env.APPS_SCRIPT_URL || 
                   localStorage.getItem('appsScriptUrl') ||
                   'https://script.google.com/macros/s/AKfycbw3q_TLfSMWDylaAGbGmqU0L-B4k28Z4NVdQ3AIFddiqvc_9WRjdTkrnhhONw109ulu0Q/exec';
    
    this.api.setEndpoint(apiUrl);
    
    const connInfo = this.api.getConnectionInfo();
    if (!connInfo.configured) {
      console.warn('API endpoint no configurado. Los envíos fallarán.');
    }
  }

  /**
   * Maneja cuando se escanea un código válido (nuevo)
   * @param {string} codigo - Código de 6 dígitos
   */
  onCodeScanned(codigo) {
    console.log('Código escaneado:', codigo);
    
    // Verificar si ya existe
    if (this.storage.isScanned(codigo)) {
      this.onDuplicateCode(codigo);
      return;
    }

    // Agregar nuevo registro
    const usuario = this.ui.getCurrentUser();
    const record = this.storage.addRecord(codigo, usuario);
    
    if (record) {
      // Feedback positivo
      this.scanner.playBeep('success');
      this.ui.showScanFeedback('success', `Maleta ${codigo} agregada`);
      
      // Re-renderizar lista
      this.ui.renderMaletasList();
      
      console.log('Registro agregado:', record);
    } else {
      this.onScanError('Error agregando registro');
    }
  }

  /**
   * Maneja cuando se escanea un código duplicado
   * @param {string} codigo - Código ya existente
   */
  onDuplicateCode(codigo) {
    console.log('Código duplicado:', codigo);
    
    // Feedback negativo
    this.scanner.playBeep('error');
    this.ui.showScanFeedback('error', `Maleta ${codigo} ya registrada`);
  }

  /**
   * Maneja errores en el escaneo
   * @param {string|Error} error - Error ocurrido
   */
  onScanError(error) {
    console.error('Error en escaneo:', error);
    
    this.scanner.playBeep('error');
    this.ui.showMessage(typeof error === 'string' ? error : error.message, 'error');
  }

  /**
   * Callback para cambios en categorías
   * @param {string} codigo - Código de la maleta
   * @param {string} categoria - Categoría cambiada (A, B, C)
   * @param {boolean} newState - Nuevo estado de la categoría
   */
  onCategoryChange(codigo, categoria, newState) {
    console.log(`Categoría ${categoria} de maleta ${codigo}: ${newState}`);
    // Aquí se podría agregar lógica adicional como auto-guardado
  }

  /**
   * Callback para cambios en observaciones
   * @param {string} codigo - Código de la maleta
   * @param {string} observacion - Nueva observación
   */
  onObservationChange(codigo, observacion) {
    console.log(`Observación de maleta ${codigo}: "${observacion}"`);
    // Aquí se podría agregar lógica adicional como auto-guardado
  }

  /**
   * Maneja el envío de registros
   */
  async handleSendRecords() {
    if (this.isSending) {
      console.log('Envío ya en progreso...');
      return;
    }

    const records = this.storage.getFormattedRecords();
    
    if (records.length === 0) {
      this.ui.showMessage('No hay registros para enviar', 'error');
      return;
    }

    this.isSending = true;
    const btnEnviar = document.getElementById('btn-enviar');
    const originalText = btnEnviar.textContent;
    
    try {
      // Feedback visual
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';
      this.ui.showMessage('Enviando registros al servidor...', 'info');
      
      // Enviar con reintentos
      const result = await this.api.sendRecordsWithRetry(records);
      
      if (result.success) {
        this.ui.showMessage(
          `${result.recordsCount} registros enviados correctamente`, 
          'success'
        );
        
        // Limpiar registros después de envío exitoso
        this.storage.clearRecords();
        this.ui.renderMaletasList();
        
        console.log('Envío exitoso:', result);
      }

    } catch (error) {
      console.error('Error en envío:', error);
      this.ui.showMessage(
        `Error enviando datos: ${error.message}`, 
        'error'
      );

    } finally {
      // Restaurar botón
      this.isSending = false;
      btnEnviar.disabled = false;
      btnEnviar.textContent = originalText;
    }
  }

  /**
   * Maneja el vaciado de todos los registros
   */
  handleClearAll() {
    const stats = this.storage.getStats();
    
    if (stats.total === 0) {
      this.ui.showMessage('No hay registros para vaciar', 'info');
      return;
    }

    // Confirmar acción
    if (confirm(`¿Estás seguro de vaciar ${stats.total} registros? Esta acción no se puede deshacer.`)) {
      this.ui.clearList();
      console.log('Registros vaciados por el usuario');
    }
  }

  /**
   * Obtiene estadísticas de la aplicación
   * @returns {Object} - Estadísticas actuales
   */
  getAppStats() {
    return {
      ...this.storage.getStats(),
      isScanning: this.scanner.isScanning,
      apiConfigured: this.api.getConnectionInfo().configured,
      online: navigator.onLine
    };
  }

  /**
   * Reinicia el escáner en caso de errores
   */
  async restartScanner() {
    try {
      const video = document.getElementById('video');
      await this.scanner.restartScanner(
        video,
        this.onCodeScanned.bind(this),
        this.onDuplicateCode.bind(this),
        this.onScanError.bind(this)
      );
      
      this.ui.showMessage('Escáner reiniciado', 'success');
      
    } catch (error) {
      console.error('Error reiniciando escáner:', error);
      this.ui.showMessage('Error reiniciando escáner', 'error');
    }
  }

  /**
   * Limpia recursos al cerrar la aplicación
   */
  destroy() {
    this.scanner.stopScanner();
    console.log('Aplicación cerrada, recursos liberados');
  }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const app = new MaletasApp();
  await app.init();
  
  // Exponer app globalmente para debugging
  if (process.env.NODE_ENV === 'development') {
    window.maletasApp = app;
  }
  
  // Manejar cierre de aplicación
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
});

export default MaletasApp;