/**
 * ui.js - Manejo de la interfaz de usuario
 */

class UI {
  constructor(storage) {
    this.storage = storage;
    this.currentModalCodigo = null;
    this.onCategoryChange = null; // Callback para cambios de categoría
    this.onObservationChange = null; // Callback para cambios de observación
    
    this.initializeModal();
  }

  /**
   * Renderiza la lista completa de maletas
   */
  renderMaletasList() {
    const listaEl = document.getElementById('lista-maletas');
    const records = this.storage.getRecords();
    
    if (records.length === 0) {
      listaEl.innerHTML = '<li class="empty-message">No hay maletas escaneadas</li>';
      this.updateSendButton(false);
      return;
    }

    // Ordenar por fecha (más reciente primero)
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );

    listaEl.innerHTML = sortedRecords
      .map(record => this.createMaletaItem(record))
      .join('');

    // Agregar event listeners a los botones
    this.attachCategoryListeners();
    this.attachObservationListeners();
    
    // Habilitar botón enviar si hay registros
    this.updateSendButton(true);
  }

  /**
   * Crea el HTML para un item de maleta
   * @param {Object} record - Registro de maleta
   * @returns {string} - HTML del item
   */
  createMaletaItem(record) {
    const hasObservation = record.observacion.length > 0;
    const observationPreview = hasObservation 
      ? `<div class="observation-preview">${record.observacion.substring(0, 50)}${record.observacion.length > 50 ? '...' : ''}</div>`
      : '';

    return `
      <li class="maleta-item" data-codigo="${record.codigo}">
        <div class="maleta-header">
          <span class="maleta-codigo">${record.codigo}</span>
          <div class="maleta-info">
            <span class="maleta-hora">${record.fechaHora}</span>
            <span class="maleta-turno">${record.turno}</span>
          </div>
        </div>
        
        <div class="categorias-container">
          <button class="categoria-btn ${record.categorias.A ? 'active' : ''}" 
                  data-categoria="A" data-codigo="${record.codigo}">A</button>
          <button class="categoria-btn ${record.categorias.B ? 'active' : ''}" 
                  data-categoria="B" data-codigo="${record.codigo}">B</button>
          <button class="categoria-btn ${record.categorias.C ? 'active' : ''}" 
                  data-categoria="C" data-codigo="${record.codigo}">C</button>
          <button class="categoria-btn obs-btn ${hasObservation ? 'active' : ''}" 
                  data-codigo="${record.codigo}">OBS</button>
        </div>
        
        ${observationPreview}
      </li>
    `;
  }

  /**
   * Agrega event listeners a los botones de categoría
   */
  attachCategoryListeners() {
    const categoryBtns = document.querySelectorAll('.categoria-btn:not(.obs-btn)');
    
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const codigo = e.target.dataset.codigo;
        const categoria = e.target.dataset.categoria;
        
        // Toggle visual
        btn.classList.toggle('active');
        
        // Actualizar storage
        const currentRecord = this.storage.getRecord(codigo);
        if (currentRecord) {
          const newState = !currentRecord.categorias[categoria];
          this.storage.updateCategories(codigo, { [categoria]: newState });
          
          // Callback para notificar cambios
          if (this.onCategoryChange) {
            this.onCategoryChange(codigo, categoria, newState);
          }
        }
      });
    });
  }

  /**
   * Agrega event listeners a los botones de observación
   */
  attachObservationListeners() {
    const obsBtns = document.querySelectorAll('.obs-btn');
    
    obsBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const codigo = e.target.dataset.codigo;
        this.openObservationModal(codigo);
      });
    });
  }

  /**
   * Inicializa el modal de observaciones
   */
  initializeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalAceptar = document.getElementById('modal-aceptar');
    const modalVaciar = document.getElementById('modal-vaciar');
    const textarea = document.getElementById('observaciones-textarea');

    // Botón aceptar
    modalAceptar.addEventListener('click', () => {
      this.saveObservation();
    });

    // Botón vaciar
    modalVaciar.addEventListener('click', () => {
      textarea.value = '';
      textarea.focus();
    });

    // Cerrar al hacer click fuera del modal
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeObservationModal();
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModalCodigo) {
        this.closeObservationModal();
      }
    });
  }

  /**
   * Abre el modal de observaciones
   * @param {string} codigo - Código de la maleta
   */
  openObservationModal(codigo) {
    this.currentModalCodigo = codigo;
    const record = this.storage.getRecord(codigo);
    const textarea = document.getElementById('observaciones-textarea');
    const modalOverlay = document.getElementById('modal-overlay');
    
    // Pre-cargar observación existente
    if (record && record.observacion) {
      textarea.value = record.observacion;
    } else {
      textarea.value = '';
    }
    
    // Mostrar modal
    modalOverlay.classList.add('active');
    
    // Enfocar textarea con pequeño delay
    setTimeout(() => textarea.focus(), 100);
  }

  /**
   * Cierra el modal de observaciones
   */
  closeObservationModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('active');
    this.currentModalCodigo = null;
  }

  /**
   * Guarda la observación y cierra el modal
   */
  saveObservation() {
    if (!this.currentModalCodigo) return;
    
    const textarea = document.getElementById('observaciones-textarea');
    const observacion = textarea.value.trim();
    
    // Actualizar storage
    this.storage.updateObservation(this.currentModalCodigo, observacion);
    
    // Callback para notificar cambios
    if (this.onObservationChange) {
      this.onObservationChange(this.currentModalCodigo, observacion);
    }
    
    // Cerrar modal y re-renderizar lista
    this.closeObservationModal();
    this.renderMaletasList();
  }

  /**
   * Actualiza el estado del botón enviar
   * @param {boolean} enabled - Si debe estar habilitado
   */
  updateSendButton(enabled) {
    const btnEnviar = document.getElementById('btn-enviar');
    const stats = this.storage.getStats();
    
    btnEnviar.disabled = !enabled || stats.total === 0;
    btnEnviar.textContent = `Enviar Registros (${stats.total})`;
  }

  /**
   * Muestra feedback visual en el contenedor del escáner
   * @param {string} type - 'success' o 'error'
   * @param {string} message - Mensaje a mostrar
   */
  showScanFeedback(type, message = '') {
    const container = document.getElementById('scanner-container');
    const statusEl = document.getElementById('scanner-status');
    
    // Agregar clase de flash
    container.classList.add(type === 'success' ? 'flash-success' : 'flash-error');
    
    // Mostrar mensaje
    if (message) {
      statusEl.textContent = message;
    }
    
    // Remover clase después de la animación
    setTimeout(() => {
      container.classList.remove('flash-success', 'flash-error');
    }, 500);
  }

  /**
   * Muestra un mensaje de estado en la app
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje ('info', 'success', 'error')
   */
  showMessage(message, type = 'info') {
    const statusEl = document.getElementById('scanner-status');
    
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
    
    // Auto-ocultar después de unos segundos
    setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = '';
        statusEl.className = '';
      }
    }, 3000);
  }

  /**
   * Actualiza el contador de registros en tiempo real
   */
  updateCounter() {
    const stats = this.storage.getStats();
    this.updateSendButton(stats.total > 0);
  }

  /**
   * Limpia la lista y actualiza la UI
   */
  clearList() {
    this.storage.clearRecords();
    this.renderMaletasList();
    this.showMessage('Lista vaciada correctamente', 'success');
  }

  /**
   * Obtiene el nombre del usuario actual
   * @returns {string} - Nombre del usuario
   */
  getCurrentUser() {
    const userInput = document.getElementById('usuario-input');
    return userInput.value.trim() || 'desconocido';
  }

  /**
   * Establece callbacks para eventos
   * @param {Function} onCategoryChange - Callback para cambios de categoría
   * @param {Function} onObservationChange - Callback para cambios de observación
   */
  setCallbacks(onCategoryChange, onObservationChange) {
    this.onCategoryChange = onCategoryChange;
    this.onObservationChange = onObservationChange;
  }
}

export default UI;