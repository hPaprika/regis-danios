import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember that user dismissed the prompt (optional)
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if user previously dismissed or if already installed
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed === "true") {
      setShowPrompt(false);
    }

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Instalar aplicación
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Instala esta app en tu dispositivo para un acceso rápido y trabajar sin conexión.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="outline">
              Ahora no
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          size="icon"
          variant="ghost"
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
