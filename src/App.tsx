import { useState, useEffect } from "react";
import SiberiaPage from "@/pages/SiberiaPage";
import RecordsPage from "@/pages/RecordsPage";

/**
 * Simple Router Component
 * Maneja la navegación entre páginas sin librerías externas
 */
const App = () => {
  // Estado para la ruta actual
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Efecto para escuchar cambios en el historial del navegador
  useEffect(() => {
    // Función que actualiza la ruta cuando el usuario usa los botones del navegador
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    // Escuchar eventos de navegación del navegador (back/forward)
    window.addEventListener("popstate", handlePopState);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Función de navegación global que se puede usar desde cualquier componente
  useEffect(() => {
    // Exponer función de navegación globalmente
    (window as any).navigateTo = (path: string) => {
      // Actualizar el historial del navegador
      window.history.pushState({}, "", path);
      // Actualizar el estado local para re-renderizar
      setCurrentPath(path);
    };
  }, []);

  // Renderizar el componente correspondiente según la ruta
  const renderPage = () => {
    switch (currentPath) {
      case "/":
        return <SiberiaPage />;
      case "/records":
        return <RecordsPage />;
      default:
        // Si la ruta no existe, redirigir a la página principal
        window.history.replaceState({}, "", "/");
        return <SiberiaPage />;
    }
  };

  return renderPage();
};

export default App;
