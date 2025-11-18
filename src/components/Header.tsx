import { ScanBarcode, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-primary text-primary-foreground w-full px-4 py-2 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScanBarcode className="size-9 opacity-90" />
          <div>
            <h1 className="text-xl font-bold">RegisDaños</h1>
            <p className="text-sm opacity-90">Escanea la colilla de la maleta</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
