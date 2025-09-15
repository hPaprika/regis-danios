/**
 * ui.js - Manejo de la interfaz de usuario
 */

class UI {
  /**
   * Obtiene el nombre del usuario actual
   */
  getCurrentUsuario() {
    return localStorage.getItem('encargado') || 'desconocido';
  }

  /**
   * Establece el nombre del usuario actual
   */
  setCurrentUsuario(nombre) {
    localStorage.setItem('encargado', nombre);
  }
  /**
   * Abre la modal para editar el encargado
   */
  openEncargadoModal() {
    const modal = document.getElementById('config-usuario');
    const input = document.getElementById('usuario-input');
    const aceptarBtn = document.getElementById('modal-encargado-aceptar');
    const cancelarBtn = document.getElementById('modal-encargado-cancelar');
    if (!modal || !input || !aceptarBtn || !cancelarBtn) return;

    // Mostrar modal
    modal.style.display = 'flex';
    input.value = '';
    setTimeout(() => input.focus(), 100);

    // Handler aceptar
    const onAceptar = () => {
      const nuevo = input.value.trim() || 'desconocido';
      if (this.setCurrentUsuario) this.setCurrentUsuario(nuevo);
      modal.style.display = 'none';
      this.renderMaletasList();
      aceptarBtn.removeEventListener('click', onAceptar);
      cancelarBtn.removeEventListener('click', onCancelar);
    };
    // Handler cancelar
    const onCancelar = () => {
      modal.style.display = 'none';
      aceptarBtn.removeEventListener('click', onAceptar);
      cancelarBtn.removeEventListener('click', onCancelar);
    };
    aceptarBtn.addEventListener('click', onAceptar);
    cancelarBtn.addEventListener('click', onCancelar);
    // Cerrar con ESC
    const onKey = (e) => {
      if (e.key === 'Escape') onCancelar();
    };
    document.addEventListener('keydown', onKey, { once: true });
  }
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
    const encabezadoEl = document.getElementById('maletas-encabezado');
    const records = this.storage.getRecords();
    // Obtener datos globales
    let encargado = this.getCurrentUsuario ? this.getCurrentUsuario() : '';
    const turno = records.length > 0 ? records[0].turno : '-';
    const fecha = records.length > 0 ? records[0].fechaHora.split(' ')[0] : (new Date()).toLocaleDateString();

    // Si el encargado es vacío o desconocido, solo mostrar ícono
    let encargadoHtml = '';
    if (!encargado || encargado === 'desconocido') {
      encargadoHtml = `<span id="encargado-span" class="encargado-interactivo solo-icono" title="Editar encargado">Encargado: &#128100;</span>`;
    } else {
      encargadoHtml = `<span id="encargado-span" class="encargado-interactivo" title="Editar encargado">Encargado: ${encargado} <span style="font-size:1.2em;vertical-align:middle">&#128100;</span></span>`;
    }

    if (encabezadoEl) {
      encabezadoEl.innerHTML = `
        <div class="encabezado-datos-modal">
          <div class="encargado-row">${encargadoHtml}</div>
          <div class="turno-fecha-row">
            <span class="turno-label">Turno:</span> <span>${turno}</span><br>
            <span class="fecha-label">Fecha:</span> <span>${fecha}</span>
          </div>
        </div>
      `;
      // Evento para abrir modal al pulsar encargado
      const encargadoSpan = document.getElementById('encargado-span');
      if (encargadoSpan) {
        encargadoSpan.onclick = () => this.openEncargadoModal && this.openEncargadoModal();
        encargadoSpan.classList.add('destacado-encargado');
      }
    }

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
    this.attachDeleteMaletaListeners();
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

    // Extraer solo la hora (HH:mm) de fechaHora
    let hora = '';
    if (record.fechaHora) {
      const match = record.fechaHora.match(/\b(\d{2}:\d{2})\b/);
      hora = match ? match[1] : '';
    }
    return `
      <li class="maleta-item" data-codigo="${record.codigo}">
        <div class="maleta-header" style="justify-content:space-between;align-items:center;">
          <span class="maleta-codigo">${record.codigo}</span>
          <span class="maleta-hora-sola">${hora}</span>
        </div>
        <div class="maleta-row-flex">
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
          <button class="btn-eliminar-maleta" title="Eliminar maleta" data-codigo="${record.codigo}" style="font-size:1.3em;padding:0.2em 0.5em;background:none;border:none;cursor:pointer;color:#e03131;align-self:center;">&#128465;</button>
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
   * Agrega event listeners a los botones de eliminar maleta
   */
  attachDeleteMaletaListeners() {
    const deleteBtns = document.querySelectorAll('.btn-eliminar-maleta');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const codigo = e.target.dataset.codigo;
        if (codigo && confirm('¿Eliminar este registro?')) {
          this.storage.records.delete(codigo);
          this.renderMaletasList();
        }
      });
    });
  }

  /**
   * Inicializa el modal de observaciones
   */
  initializeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalAceptar = document.getElementById('modal-aceptar');
    const textarea = document.getElementById('observaciones-textarea');

    // Botón aceptar
    modalAceptar.addEventListener('click', () => {
      this.saveObservation();
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