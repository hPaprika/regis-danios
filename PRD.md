# 📋 PRD – App PWA de Escaneo y Categorización de Maletas Dañadas

## 1. Objetivo

La aplicación permitirá a los operarios de un aeropuerto **escanear etiquetas de maletas dañadas** con la cámara trasera del móvil, **categorizarlas de inmediato**, registrar observaciones y **enviar los datos a Google Sheets** compartidos entre usuarios.

Será desarrollada como una **PWA ligera** con interfaz simple y optimizada para móviles.

---

## 2. Usuarios Finales

* Operarios de aeropuerto con conocimientos básicos de móviles.
* Requisitos principales: **rapidez, claridad y facilidad de uso**.

---

## 3. Flujo de Uso

1. La app abre con la cámara trasera activada (640x480).
2. El operario escanea la etiqueta de la maleta:

   * El sistema toma únicamente los **6 últimos dígitos** del código.
   * Si es nuevo → se agrega a la lista, suena confirmación ✅ y se aplica un **pequeño delay (≈1s)** para evitar un falso disparo de error inmediato.
   * Si ya existe → no se agrega y suena error ❌.
3. Cada maleta listada tiene botones de categoría:

   * **A** = Asa rota
   * **B** = Maleta rota
   * **C** = Rueda rota
   * **OBS** = Observaciones (abre modal)
   * Botones son toggles → se pueden marcar múltiples a la vez.
   * Botones usan **feedback visual por color**, sin `hover` (pues es confuso en móviles).
4. Al presionar **OBS**:

   * Se abre un modal con:

     * Título: (Observaciones)
     * Textarea con `placeholder` de detalles
     * Botón “Aceptar”
     * Botón “Vaciar” (solo limpia contenido del modal)
   * Fondo con **blur**
   * Se puede cerrar tocando fuera de la modal.
   * Al confirmar → OBS queda marcado en la lista.
5. Cada registro incluirá automáticamente:

   * Código (6 últimos dígitos)
   * Categorías seleccionadas
   * Observaciones (si aplica)
   * Fecha y hora (automática)
   * Identificador del usuario (nombre y apellido ingresado → default: “desconocido”)
   * **Turno** → calculado en base a la hora:

     * 04:00 a 12:59 → `"BRC-ERC"`
     * 13:00 a 23:59 → `"IRC-KRC"`
6. Botón principal **“Enviar”** envía todos los registros a Google Sheets.
7. Botón secundario **“Vaciar”** limpia la lista actual de registros.

---

## 4. Requerimientos Funcionales

* [ ] Escaneo con **ZXing via CDN**:
  `https://unpkg.com/@zxing/library@0.21.3`
* [ ] Uso de cámara trasera (`facingMode: environment`).
* [ ] Delay de seguridad tras escaneo exitoso.
* [ ] Prevención de duplicados.
* [ ] Feedback con sonidos:

  * ✅ Confirmación (nuevo código)
  * ❌ Error (código repetido)
* [ ] Interfaz móvil optimizada, sin `hover`.
* [ ] Categorías toggle con colores de estado activo.
* [ ] Modal con blur y cierre fuera de área.
* [ ] Botones extra:

  * Vaciar contenido de modal
  * Vaciar lista de registros
* [ ] Registro automático de fecha/hora, turno y usuario.
* [ ] Envío a Google Sheets vía API (Apps Script backend).

---

## 5. Requerimientos No Funcionales

* **Evergreen browsers** → Chrome 138+ (sin retrocompatibilidad).
* Tecnologías:

  * HTML5 semántico
  * CSS moderno
  * JS moderno (ES2023+) sin frameworks
* PWA → instalación opcional en móviles, con:

  * `manifest.json`
  * `service worker` básico (offline shell)

---

## 6. Diseño UI

* **Colores base (Coolors export):**

  ```css
  --color-old-rose: #a87772ff;
  --color-engineering-orange: #bd2813ff;
  --color-chili-red: #e4320bff;
  ```
* Cámara centrada (640x480).
* Lista de códigos debajo, con botones de categorías en una línea.
* Modal minimalista con fondo difuminado.
* Botón “Enviar” y “Vaciar todo” al pie de la lista.

---

## 7. Integración con Google Sheets

* Backend en Google Apps Script.
* App enviará datos en formato JSON vía `fetch`.
* Apps Script insertará filas en hoja compartida con columnas:

  * `Código | Categorías | Observaciones | FechaHora | Usuario | Turno`

---

## 8. Criterios de Aceptación

* Escanear un código → aparece en lista con 6 dígitos, sonido de confirmación.
* Escanearlo de nuevo → no aparece y suena error.
* Categorías se marcan/desmarcan con color.
* Modal de OBS funciona con blur, textarea y botones.
* Botón “Vaciar todo” limpia la lista.
* Enviar datos → filas correctas en Google Sheets.
* PWA instalable en Chrome móvil.
