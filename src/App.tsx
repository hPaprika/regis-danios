import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import SiberiaPage from "./pages/SiberiaPage";
import RecordsPage from "./pages/RecordsPage";

const App = () => {
  const [route, setRoute] = useState<"siberia" | "records">("siberia");

  useEffect(() => {
    // minimal navigation API: window.appNavigate(path)
    (window as any).appNavigate = (path: string) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      setRoute(p === "/records" ? "records" : "siberia");
    };

    return () => {
      try {
        delete (window as any).appNavigate;
      } catch { }
    };
  }, []);

  return (
    <>
      <Sonner />
      {route === "records" ? <RecordsPage /> : <SiberiaPage />}
    </>
  );
};

export default App;
