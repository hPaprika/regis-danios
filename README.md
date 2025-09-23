# 🧳 Escáner de Maletas Dañadas

Una aplicación web sencilla diseñada para el personal del aeropuerto para escanear, categorizar y registrar rápidamente el equipaje dañado. Es una Aplicación Web Progresiva (PWA), lo que significa que está optimizada para dispositivos móviles e incluso se puede "instalar" en la pantalla de inicio de un teléfono para un acceso rápido.

---

## ✨ Características Principales

- **Escaneo de Códigos de Barras:** Utiliza la cámara de tu teléfono para escanear las etiquetas del equipaje al instante.
- **Registro Automático:** Captura los últimos 6 dígitos del código de la etiqueta.
- **Categorización de Daños:** Etiqueta rápidamente el tipo de daño:
    - **A:** Asa rota
    - **B:** Maleta rota
    - **C:** Rueda rota
    - **OBS:** Añade notas personalizadas para otros problemas.
- **Prevención de Duplicados:** Evita escanear la misma maleta dos veces.
- **Carga en Lote:** Envía todos los informes registrados a una hoja de cálculo de Google compartida de una sola vez.
- **Información Inteligente:** Registra automáticamente el nombre del operador y el turno.
- **Funciona sin Conexión:** La aplicación base funciona incluso sin conexión a internet.

---

## 🚀 Cómo Usar

1.  **Abre la Aplicación:** Navega a la URL de la aplicación en tu teléfono u ordenador.
2.  **Ingresa tu Nombre:** Escribe tu nombre en el campo de la parte inferior. Se usará para identificar tus informes.
3.  **Escanea la Etiqueta del Equipaje:** Apunta la cámara trasera al código de barras de la etiqueta del equipaje. El código aparecerá en la lista.
4.  **Categoriza el Daño:** Toca los botones (`A`, `B`, `C`) para marcar el tipo de daño. Usa `OBS` para añadir notas específicas si es necesario.
5.  **Envía tus Informes:** Una vez que hayas registrado todas las maletas dañadas, toca el botón "Enviar Registros" para subir todo a la hoja de cálculo de Google.
6.  **Limpia la Lista:** Si necesitas empezar de nuevo, toca "Vaciar Lista" para eliminar todos los elementos escaneados de la pantalla.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con HTML, CSS y JavaScript puros, utilizando la librería ZXing para el escaneo de códigos de barras. Los datos se envían a un backend de Google Apps Script que alimenta una hoja de cálculo de Google.
