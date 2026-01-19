import { useState, useEffect } from "react";
import SiberiaPage from "@/pages/SiberiaPage";
import RecordsPage from "@/pages/RecordsPage";

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    (window as any).navigateTo = (path: string) => {
      window.history.pushState({}, "", path);
      setCurrentPath(path);
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case "/":
        return <SiberiaPage />;
      case "/records":
        return <RecordsPage />;
      default:
        window.history.replaceState({}, "", "/");
        return <SiberiaPage />;
    }
  };

  return renderPage();
};

export default App;
