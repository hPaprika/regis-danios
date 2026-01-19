# PWA - Registro de Daños de Maletas

Esta aplicación es una **Progressive Web App (PWA)** completa que puede instalarse en dispositivos móviles y de escritorio.

## 🚀 Características PWA

- ✅ **Instalable**: Se puede instalar como una app nativa en cualquier dispositivo
- ✅ **Funciona offline**: Cachea recursos para funcionar sin conexión
- ✅ **Actualizaciones automáticas**: Se actualiza automáticamente cuando hay nuevas versiones
- ✅ **Experiencia nativa**: Se ejecuta en pantalla completa sin la barra del navegador
- ✅ **Iconos optimizados**: Iconos para Android, iOS y escritorio
- ✅ **Rápida**: Cachea recursos estáticos para carga instantánea

## 📱 Instalación

### En Android (Chrome/Edge)

1. Abre la aplicación en Chrome o Edge
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"
4. Confirma la instalación

### En iOS (Safari)

1. Abre la aplicación en Safari
2. Toca el botón de compartir (□↑)
3. Desplázate y selecciona "Agregar a pantalla de inicio"
4. Toca "Agregar"

### En Escritorio (Chrome/Edge)

1. Abre la aplicación en Chrome o Edge
2. Busca el ícono de instalación (+) en la barra de direcciones
3. Haz clic en "Instalar"
4. La app se abrirá en su propia ventana

## 🔧 Desarrollo

### Construir para producción

```bash
pnpm run build
```

### Previsualizar build de producción

```bash
pnpm run preview
```

### Probar PWA en desarrollo

La PWA está habilitada en modo desarrollo. Simplemente ejecuta:

```bash
pnpm run dev
```

## 📦 Archivos PWA

- `vite.config.ts`: Configuración del plugin PWA
- `public/manifest.json`: Generado automáticamente por vite-plugin-pwa
- `public/pwa-192x192.png`: Ícono de 192x192px
- `public/pwa-512x512.png`: Ícono de 512x512px
- `public/apple-touch-icon.png`: Ícono para iOS
- `public/sw.js`: Service Worker (generado automáticamente)

## 🎨 Personalización

### Cambiar colores del tema

Edita `vite.config.ts`:

```typescript
manifest: {
  theme_color: '#2563eb',  // Color de la barra de estado
  background_color: '#ffffff',  // Color de fondo al abrir
}
```

### Cambiar iconos

Reemplaza los archivos en `public/`:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `apple-touch-icon.png`

## 🔄 Actualizaciones

La aplicación se actualiza automáticamente cuando detecta una nueva versión. El service worker:

1. Descarga la nueva versión en segundo plano
2. Espera a que el usuario cierre todas las pestañas
3. Activa la nueva versión al reabrir

## 📊 Cache Strategy

- **Archivos estáticos**: CacheFirst (HTML, CSS, JS, imágenes)
- **Google Fonts**: CacheFirst con expiración de 1 año
- **API calls**: NetworkFirst (siempre intenta red primero)

## 🛠️ Troubleshooting

### La app no se instala

- Verifica que estés usando HTTPS (requerido para PWA)
- Asegúrate de que el manifest.json se esté generando correctamente
- Revisa la consola del navegador para errores

### Los cambios no se reflejan

- Limpia el cache del navegador
- Desregistra el service worker en DevTools > Application > Service Workers
- Haz un hard refresh (Ctrl+Shift+R o Cmd+Shift+R)

### Probar en localhost

PWA funciona en localhost sin HTTPS. Para probar en dispositivos móviles en la misma red:

1. Encuentra tu IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Accede desde el móvil: `http://TU_IP:5173`
3. Nota: Algunas funciones PWA pueden no funcionar sin HTTPS

## 📚 Recursos

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
