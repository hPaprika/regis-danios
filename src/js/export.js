// ===== ELEMENTOS DEL DOM =====
const elements = {
  previewContainer: document.getElementById("preview-container"),
  exportView: document.getElementById("export-view"),
  title: document.getElementById("preview-title"),
  count: document.getElementById("card-count")
};

// ===== FUNCIONES DE DATOS =====
function getData() {
  try {
    const rawData = localStorage.getItem("previewRecords");
    if (!rawData) return [];

    const parsedData = JSON.parse(rawData);

    // Verificar si tiene la estructura con 'records'
    if (parsedData.records && Array.isArray(parsedData.records)) {
      console.log("Datos cargados:", parsedData.records.length, "registros");
      return parsedData.records;
    }

    // Si es un array directo (formato anterior)
    if (Array.isArray(parsedData)) {
      console.log("Datos formato directo:", parsedData.length, "registros");
      return parsedData;
    }

    console.warn("Formato de datos no reconocido:", parsedData);
    return [];

  } catch (error) {
    console.error("Error parsing localStorage data:", error);
    return [];
  }
}

function getUserData() {
  return localStorage.getItem("regis-danos-user") || "Usuario";
}

function formatDate() {
  return new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function clearRecords() {
  if (confirm("¿Está seguro de eliminar todos los registros?")) {
    localStorage.removeItem("previewRecords");
    loadData();
  }
}

// ===== FUNCIONES DE RENDERIZADO =====
function loadData() {
  renderPreview();
}

function renderPreview() {
  const data = getData();
  const container = elements.previewContainer;

  // Update header info
  elements.title.textContent = `Registro de Daños - ${formatDate()}`;
  elements.count.textContent = `Total: ${data.length} registros`;

  // Clear container
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>📦 No hay registros</h3>
        <p>Los registros de maletas aparecerán aquí cuando se agreguen desde el sistema principal.</p>
      </div>
    `;
    return;
  }

  renderCards(container, data, false);
}

function renderCards(container, data, isExport = false) {
  const itemsPerRow = isExport ? 5 : 3;
  const gridClass = isExport ? "export-grid" : "preview-grid";
  let currentGrid = null;

  data.forEach((item, index) => {
    // Create new grid row when needed
    if (index % itemsPerRow === 0) {
      currentGrid = document.createElement("div");
      currentGrid.className = gridClass;
      container.appendChild(currentGrid);
    }

    const card = createCard(item, index + 1, isExport);
    currentGrid.appendChild(card);
  });
}

function createCard(item, cardNumber, isExport = false) {
  const card = document.createElement("div");
  card.className = "card";

  // Create barcode canvas
  const canvas = document.createElement("canvas");
  try {
    JsBarcode(canvas, item.code, {
      format: "CODE128",
      width: 2,
      height: isExport ? 50 : 35,
      displayValue: false,
      margin: 0
    });
  } catch (error) {
    console.error("Error generating barcode:", error);
    canvas.width = 100;
    canvas.height = isExport ? 50 : 35;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error', canvas.width / 2, canvas.height / 2);
  }

  // Code number
  const codeDiv = document.createElement("div");
  codeDiv.className = "code-number";
  codeDiv.textContent = item.code || 'Sin código';

  // ABC indicators - PROCESAMIENTO CORREGIDO
  const abcRow = document.createElement("div");
  abcRow.className = "abc-row";

  // Función para procesar categories según tu formato
  function getActiveCategories(categories) {
    if (categories && typeof categories === 'object' && !Array.isArray(categories)) {
      const active = [];
      if (categories.A === true) active.push('A');
      if (categories.B === true) active.push('B');
      if (categories.C === true) active.push('C');
      return active;
    }

    if (typeof categories === 'string') {
      return categories.split(',').map(c => c.trim()).filter(c => c !== '');
    }

    return [];
  }

  const activeCategories = getActiveCategories(item.categories);

  ["A", "B", "C"].forEach(letter => {
    const box = document.createElement("div");
    box.className = `abc-box ${activeCategories.includes(letter) ? 'active' : 'inactive'}`;
    box.textContent = letter;
    abcRow.appendChild(box);
  });

  // Observation
  const observation = document.createElement("div");
  const obsText = (item.observation && typeof item.observation === 'string' && item.observation.trim() !== '')
    ? item.observation.trim()
    : "Sin observaciones";

  observation.className = `observation ${obsText === "Sin observaciones" ? 'empty' : ''}`;
  observation.textContent = obsText;

  // Assemble card
  card.appendChild(canvas);
  card.appendChild(codeDiv);
  card.appendChild(abcRow);
  card.appendChild(observation);

  return card;
}

function renderExportView() {
  const data = getData();
  const user = getUserData();
  const container = elements.exportView;

  // Get shift info from first record or default
  const shift = data.length > 0 ? data[0].shift || "Turno General" : "Turno General";

  container.innerHTML = `
    <div class="export-header">
      <h1>Registro de Daños</h1>
      <div class="export-header-content">
        <div class="export-info">
          <div>Fecha: ${formatDate()}</div>
          <div>Encargado: ${user}</div>
          <div>Turno: ${shift}</div>
          <div>Total: ${data.length}</div>
        </div>
        <div class="export-legend">
          A: asa rota<br>
          B: maleta rota<br>
          C: rueda rota
        </div>
      </div>
    </div>
    <div class="export-content"></div>
  `;

  const contentContainer = container.querySelector('.export-content');
  renderCards(contentContainer, data, true);
}

// ===== FUNCIONES DE EXPORTACIÓN =====
async function exportAsImage() {
  const data = getData();
  if (data.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  const button = document.getElementById("export-btn");
  const originalText = button.innerHTML;
  button.innerHTML = '<span class="loading"></span> Generando...';
  button.disabled = true;

  try {
    renderExportView();

    const canvas = await html2canvas(elements.exportView, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    // Create download link
    const link = document.createElement("a");
    link.download = `maletas_${formatDate().replace(/\//g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (error) {
    console.error("Error exporting image:", error);
    alert("Error al generar la imagen. Por favor, inténtelo nuevamente.");
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

async function shareWhatsApp() {
  const data = getData();
  if (data.length === 0) {
    alert("No hay registros para compartir");
    return;
  }

  const button = document.getElementById("whatsapp-btn");
  const originalText = button.innerHTML;
  button.innerHTML = '<span class="loading"></span> Preparando...';
  button.disabled = true;

  try {
    renderExportView();

    const canvas = await html2canvas(elements.exportView, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png', 0.8);
    });

    const user = getUserData();
    const message = `📦 Registro de Daños\n📅 Fecha: ${formatDate()}\n👤 Encargado: ${user}\n📊 Total: ${data.length} registros`;

    // Try Web Share API first (modern browsers)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `maletas_${formatDate().replace(/\//g, '-')}.png`, {
        type: 'image/png'
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Registro de Daños',
          text: message,
          files: [file]
        });
        return;
      }
    }

    // Fallback to WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Also create download link as backup
    const link = document.createElement("a");
    link.download = `maletas_${formatDate().replace(/\//g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error sharing:", error);
    alert("Error al preparar el archivo para compartir.");
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

// ===== INICIALIZACIÓN =====
function initEventListeners() {
  document.getElementById("refresh-btn").addEventListener("click", loadData);
  document.getElementById("export-btn").addEventListener("click", exportAsImage);
  document.getElementById("whatsapp-btn").addEventListener("click", shareWhatsApp);
  document.getElementById("clear-btn").addEventListener("click", clearRecords);
  document.getElementById("send-btn").addEventListener("click", sendRecordsToSheets);
}

// ===== ENVÍO DE REGISTROS A SHEETS =====
import { sendRecordsWithRetry } from "./api.js";

async function sendRecordsToSheets() {
  const btn = document.getElementById("send-btn");
  btn.disabled = true;
  btn.textContent = "Enviando...";
  try {
    const stored = localStorage.getItem("previewRecords");
    let records = [];
    if (stored) {
      const obj = JSON.parse(stored);
      if (Array.isArray(obj.records)) records = obj.records;
      else if (Array.isArray(obj)) records = obj;
    }
    if (records.length === 0) {
      alert("No hay registros para enviar");
      return;
    }
    const result = await sendRecordsWithRetry(records);
    if (result.success) {
      alert(`${records.length} registros enviados correctamente a Sheets.`);
    }
  } catch (err) {
    alert("Error enviando registros: " + (err.message || err));
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar";
  }
}

function initSystem() {
  initEventListeners();
  loadData();
}

// Initialize system when DOM is ready
document.addEventListener('DOMContentLoaded', initSystem);