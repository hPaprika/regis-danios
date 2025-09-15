/**
 * storage.js - Manejo de almacenamiento de registros en memoria
 */

class Storage {
  constructor() {
    this.records = new Map(); // Usar Map para búsquedas rápidas por código
    this.scannedCodes = new Set(); // Set para verificar duplicados rápidamente
  }

  /**
   * Agrega un nuevo registro de maleta
   * @param {string} codigo - Código de 6 dígitos
   * @param {string} usuario - Nombre del operario
   * @returns {Object|null} - Registro creado o null si ya existe
   */
  addRecord(codigo, usuario = 'desconocido') {
    if (this.scannedCodes.has(codigo)) {
      return null; // Ya existe
    }

    const now = new Date();
    const record = {
      codigo,
      categorias: {
        A: false, // Asa rota
        B: false, // Maleta rota  
        C: false  // Rueda rota
      },
      observacion: '',
      fecha: now.toISOString(),
      fechaHora: this.formatDateTime(now),
      usuario: usuario.trim() || 'desconocido',
      turno: this.calculateShift(now)
    };

    this.records.set(codigo, record);
    this.scannedCodes.add(codigo);
    
    return record;
  }

  /**
   * Actualiza las categorías de daño de una maleta
   * @param {string} codigo - Código de 6 dígitos
   * @param {Object} categorias - Objeto con categorías 
      {A: true/false, B: true/false, C: true/false}
   * @returns {boolean} - true si se actualizó correctamente
   */
  updateCategories(codigo, categorias) {
    const record = this.records.get(codigo);
    if (!record) return false;

    // Actualizar solo las categorías válidas
    ['A', 'B', 'C'].forEach(cat => {
      if (typeof categorias[cat] === 'boolean') {
        record.categorias[cat] = categorias[cat];
      }
    });

    return true;
  }

  /**
   * Actualiza la observación de una maleta
   * @param {string} codigo - Código de 6 dígitos
   * @param {string} observacion - Texto de observación
   * @returns {boolean} - true si se actualizó correctamente
   */
  updateObservation(codigo, observacion) {
    const record = this.records.get(codigo);
    if (!record) return false;

    record.observacion = observacion.trim();
    return true;
  }

  /**
   * Obtiene un registro específico
   * @param {string} codigo - Código de 6 dígitos
   * @returns {Object|null} - Registro o null si no existe
   */
  getRecord(codigo) {
    return this.records.get(codigo) || null;
  }

  /**
   * Obtiene todos los registros como array
   * @returns {Array} - Array de todos los registros
   */
  getRecords() {
    return Array.from(this.records.values());
  }

  /**
   * Obtiene registros con formato para envío
   * @returns {Array} - Array de registros formateados para API
   */
  getFormattedRecords() {
    return this.getRecords().map(record => ({
      codigo: record.codigo,
      categorias: this.formatCategories(record.categorias),
      observacion: record.observacion,
      fechaHora: record.fechaHora,
      usuario: record.usuario,
      turno: record.turno
    }));
  }

  /**
   * Verifica si un código ya está escaneado
   * @param {string} codigo - Código de 6 dígitos
   * @returns {boolean} - true si ya existe
   */
  isScanned(codigo) {
    return this.scannedCodes.has(codigo);
  }

  /**
   * Limpia todos los registros
   */
  clearRecords() {
    this.records.clear();
    this.scannedCodes.clear();
  }

  /**
   * Obtiene el conteo de registros
   * @returns {number} - Número de registros
   */
  getCount() {
    return this.records.size;
  }

  /**
   * Calcula el turno basado en la hora
   * @param {Date} date - Fecha/hora
   * @returns {string} - 'BRC-ERC' o 'IRC-KRC'
   */
  calculateShift(date) {
    const hour = date.getHours();
    
    // 04:00 a 12:59 → BRC-ERC
    // 13:00 a 23:59 → IRC-KRC
    // 00:00 a 03:59 → IRC-KRC (en discusión)
    
    if (hour >= 4 && hour <= 12) {
      return 'BRC-ERC';
    } else {
      return 'IRC-KRC';
    }
  }

  /**
   * Formatea fecha y hora para visualización
   * @param {Date} date - Fecha
   * @returns {string} - Fecha formateada (dd/mm/yyyy HH:mm)
   */
  formatDateTime(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Formatea categorías para envío (convierte booleanos a string)
   * @param {Object} categorias - Objeto de categorías
   * @returns {string} - Categorías activas separadas por coma
   */
  formatCategories(categorias) {
    const active = [];
    
    if (categorias.A) active.push('A');
    if (categorias.B) active.push('B'); 
    if (categorias.C) active.push('C');
    
    return active.length > 0 ? active.join(', ') : '';
  }

  /**
   * Obtiene estadísticas básicas
   * @returns {Object} - Estadísticas de los registros
   */
  getStats() {
    const records = this.getRecords();
    const total = records.length;
    
    if (total === 0) {
      return { total: 0, conCategorias: 0, conObservaciones: 0 };
    }

    const conCategorias = records.filter(r => 
      r.categorias.A || r.categorias.B || r.categorias.C
    ).length;
    
    const conObservaciones = records.filter(r => 
      r.observacion.length > 0
    ).length;

    return {
      total,
      conCategorias,
      conObservaciones
    };
  }
}

export default Storage;