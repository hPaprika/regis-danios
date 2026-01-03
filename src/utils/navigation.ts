/**
 * Utilidades de navegación
 * Proporciona funciones type-safe para la navegación entre páginas
 */

// Definir las rutas válidas de la aplicación
export type AppRoute = "/" | "/records";

// Extender la interfaz Window para incluir nuestra función de navegación
declare global {
  interface Window {
    navigateTo: (path: AppRoute) => void;
  }
}

/**
 * Navega a una ruta específica de la aplicación
 * @param path - Ruta a la que navegar
 */
export const navigateTo = (path: AppRoute): void => {
  if (window.navigateTo) {
    window.navigateTo(path);
  } else {
    console.error("La función de navegación no está disponible");
  }
};
