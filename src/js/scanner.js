/**
 * scanner.js - Manejo de escaneo de códigos con ZXing
 */

class Scanner {
  constructor() {
    this.codeReader = null;
    this.isScanning = false;
    this.scanDelay = 1000; // 1 segundo de delay
    this.lastScanTime = 0;
    this.onCodeScanned = null; // Callback para códigos escaneados
  }

  /**
   * Inicia el escáner con la cámara trasera
   * @param {HTMLVideoElement} videoElement - Elemento video donde mostrar la cámara
   * @param {Function} onSuccess - Callback para códigos válidos (nuevos)
   * @param {Function} onDuplicate - Callback para códigos duplicados
   * @param {Function} onError - Callback para errores
   */
  async startScanner(videoElement, onSuccess, onDuplicate, onError) {
    try {
      // Solicitar acceso a cámara trasera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Cámara trasera
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }
      });

      videoElement.srcObject = stream;
      this.updateScannerStatus('Cámara activada - Apunta al código');

      // Inicializar ZXing reader
      this.codeReader = new ZXing.BrowserMultiFormatReader();
      this.isScanning = true;

      // Comenzar decodificación continua
      this.codeReader.decodeFromVideoDevice(null, videoElement, (result, error) => {
        if (result && this.isScanning) {
          this.handleScanResult(result.text, onSuccess, onDuplicate, onError);
        }
        
        if (error && !(error instanceof ZXing.NotFoundException)) {
          console.warn('Scanner error:', error);
        }
      });

    } catch (err) {
      console.error('Error al iniciar escáner:', err);
      this.updateScannerStatus('Error: No se pudo acceder a la cámara');
      if (onError) onError(err);
    }
  }

  /**
   * Procesa el resultado del escaneo
   * @param {string} rawCode - Código escaneado completo
   * @param {Function} onSuccess - Callback para códigos nuevos
   * @param {Function} onDuplicate - Callback para códigos duplicados
   * @param {Function} onError - Callback para errores
   */
  handleScanResult(rawCode, onSuccess, onDuplicate, onError) {
    const now = Date.now();
    
    // Aplicar delay para evitar múltiples lecturas
    if (now - this.lastScanTime < this.scanDelay) {
      return;
    }

    // Extraer últimos 6 dígitos
    const codigo = this.extractLastSixDigits(rawCode);
    
    if (!codigo) {
      this.playBeep('error');
      this.updateScannerStatus('Código no válido - Intenta de nuevo');
      if (onError) onError('Código no contiene suficientes dígitos');
      return;
    }

    this.lastScanTime = now;
    
    // Verificar si es duplicado (esto se hace en storage.js)
    // Aquí solo pasamos el código al callback
    if (onSuccess) {
      onSuccess(codigo);
    }
  }

  /**
   * Extrae los últimos 6 dígitos de un código
   * @param {string} code - Código completo escaneado
   * @returns {string|null} - Últimos 6 dígitos o null si no es válido
   */
  extractLastSixDigits(code) {
    // Limpiar código (solo números)
    const digits = code.replace(/\D/g, '');
    
    if (digits.length < 6) {
      return null;
    }
    
    return digits.slice(-6); // Últimos 6 dígitos
  }

  /**
   * Reproduce beep de confirmación o error
   * @param {string} type - 'success' o 'error'
   */
  playBeep(type = 'success') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'success') {
        // Beep agudo para éxito
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      } else {
        // Beep grave para error
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      
    } catch (err) {
      console.warn('No se pudo reproducir sonido:', err);
    }
  }

  /**
   * Actualiza el estado mostrado en el escáner
   * @param {string} message - Mensaje de estado
   */
  updateScannerStatus(message) {
    const statusEl = document.getElementById('scanner-status');
    if (statusEl) {
      statusEl.textContent = message;
      
      // Ocultar después de 3 segundos si no es un error
      if (!message.includes('Error') && !message.includes('Iniciando')) {
        setTimeout(() => {
          if (statusEl.textContent === message) {
            statusEl.textContent = '';
          }
        }, 3000);
      }
    }
  }

  /**
   * Detiene el escáner y libera recursos
   */
  stopScanner() {
    this.isScanning = false;
    
    if (this.codeReader) {
      this.codeReader.reset();
      this.codeReader = null;
    }
    
    const video = document.getElementById('video');
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    
    this.updateScannerStatus('Escáner detenido');
  }

  /**
   * Reinicia el escáner
   */
  async restartScanner(videoElement, onSuccess, onDuplicate, onError) {
    this.stopScanner();
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
    await this.startScanner(videoElement, onSuccess, onDuplicate, onError);
  }
}

export default Scanner;