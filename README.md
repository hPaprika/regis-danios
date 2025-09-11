# 🧳 Escáner de Maletas Dañadas – PWA

Aplicación web progresiva (PWA) para **escanear, categorizar y registrar maletas dañadas** en aeropuertos, con envío directo a Google Sheets mediante Google Apps Script. Optimizada para móviles y uso rápido por operarios.

---

## 🚀 Características principales

- **Escaneo de códigos de barras** usando la cámara trasera (ZXing vía CDN).
- **Registro automático** de los 6 últimos dígitos del código.
- **Prevención de duplicados** y feedback sonoro (éxito/error).
- **Categorización inmediata**:  
  - A = Asa rota  
  - B = Maleta rota  
  - C = Rueda rota  
  - OBS = Observaciones (modal con blur)
- **Registro de observaciones** por modal minimalista.
- **Envío masivo** de registros a Google Sheets (Apps Script backend).
- **Gestión de usuario** (nombre del operario).
- **Turno automático** según hora (BRC-ERC / IRC-KRC).
- **Vaciar lista** de registros con confirmación.
- **PWA instalable** y funcional offline (shell).
- **Interfaz móvil optimizada** y accesible.

---

## 📦 Estructura del proyecto

```
├── index.html
├── src/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js         # Coordinador principal
│       ├── scanner.js     # Lógica de escaneo (ZXing)
│       ├── storage.js     # Almacenamiento en memoria
│       ├── ui.js          # Manejo de UI y modales
│       └── api.js         # Comunicación con Apps Script
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
├── PRD.md                 # Documento de requerimientos
└── README.md
```

---

## 🛠️ Uso

1. **Abre la app** en tu móvil o PC.
2. **Ingresa tu nombre** en el panel inferior.
3. **Escanea el código de la maleta** con la cámara trasera.
4. **Marca las categorías** de daño y agrega observaciones si es necesario.
5. **Envía los registros** a Google Sheets con el botón "Enviar Registros".
6. **Vacía la lista** si deseas limpiar todos los registros locales.

---

## 📝 Personalización

- **Colores y estilos:** [`src/css/styles.css`](src/css/styles.css).
- **Categorías:** [`src/js/ui.js`](src/js/ui.js) y [`src/js/storage.js`](src/js/storage.js).
- **Validaciones y reglas:** [`src/js/scanner.js`](src/js/scanner.js) y [`src/js/storage.js`](src/js/storage.js).

---

## 🧑‍💻 Tecnologías usadas

- **HTML5, CSS3, JavaScript (ES2023+)**
- **ZXing** para escaneo de códigos ([CDN](https://unpkg.com/@zxing/library@0.21.3))
- **Google Apps Script** (backend)
- **PWA**: manifest y service worker básico

---

## 🛡️ Seguridad y consideraciones

- El backend solo acepta solicitudes POST con formato válido.
- El acceso a la hoja de cálculo depende de la configuración de Apps Script.
- No se almacena información sensible en el frontend.

---

## 📄 Licencia

MIT

---

## 🧪 Pruebas

- Usa [`test.html`](test.html) para pruebas manuales del endpoint de Apps Script.

---

## 📝 Notas finales

- Para soporte, reporta issues en el repositorio.
- Si necesitas adaptar el flujo, revisa el [PRD.md](PRD.md) para los criterios de aceptación y requerimientos.
