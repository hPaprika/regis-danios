import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { playSuccessBeep, playErrorBeep } from "@/utils/sounds";

interface ScannerViewProps {
  onScan: (code: string, isSuccess: boolean) => void;
  showManualButton?: boolean;
  onManualClick?: () => void;
}

export const ScannerView = ({ onScan, showManualButton = true, onManualClick }: ScannerViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>("Inicializando cámara...");
  const [lastScanned, setLastScanned] = useState<string>("");
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastCodeRef = useRef<string>("");
  const onScanRef = useRef(onScan);
  const scanCooldown = 2000; // 2 seconds cooldown between scans

  // Memoize the scan handler to prevent rapid repeated scans
  const handleScanResult = useCallback((code: string) => {
    const now = Date.now();

    // Prevent scanning if:
    // 1. Same code as last scan (even after cooldown)
    // 2. Within cooldown period
    if (lastCodeRef.current === code || now - lastScanTimeRef.current < scanCooldown) {
      return;
    }

    lastScanTimeRef.current = now;
    lastCodeRef.current = code;

    // Show only last 6 digits
    const displayCode = code.slice(-6);
    setLastScanned(displayCode);

    // Call onScan which will determine success/error and play appropriate sound
    onScanRef.current(code, true);

    // Clear last scanned visual after 2 seconds
    setTimeout(() => setLastScanned(""), 1000);
  }, []);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
          setStatus("No se encontró ninguna cámara");
          return;
        }

        setStatus("Esperando código de barras...");

        // Keep camera active using constraints (prefer back camera)
        await codeReader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result, error) => {
            if (result) {
              const code = result.getText();
              handleScanResult(code);
            }
            if (error && !/NotFoundException/.test((error as any).name) && (error as any).message !== "NotFoundException") {
              console.error(error);
            }
          }
        );

        // Store the video stream reference
        if (videoRef.current && videoRef.current.srcObject) {
          streamRef.current = videoRef.current.srcObject as MediaStream;
        }
      } catch (error) {
        console.error("Error starting scanner:", error);
        setStatus("Error al acceder a la cámara. Por favor, permite el acceso.");
      }
    };

    startScanner();

    return () => {
      // Stop the video stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Reset the barcode reader
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }

      // Clear the video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="relative bg-black">
      <video
        ref={videoRef}
        className="w-full h-64 object-cover"
        autoPlay
        playsInline
        muted
        preload="auto"
        style={{ backgroundColor: 'black' }}
      />

      {/* Scanner overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3/4 h-32 border-2 border-primary rounded-lg shadow-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary z-10"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary z-10"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
        </div>
      </div>

      {/* Status bar at top */}
      <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2">
        <p className="text-white text-sm text-center flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          {status}
        </p>
      </div>

      {/* Last scanned code overlay at bottom */}
      {lastScanned && (
        <div className="absolute bottom-0 left-0 right-0 bg-accent/90 backdrop-blur-sm px-4 py-3 animate-fade-in">
          <p className="text-white text-center font-medium">
            Escaneado: <span className="font-bold">{lastScanned}</span>
          </p>
        </div>
      )}

      {/* Floating manual code button */}
      {showManualButton && onManualClick && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            onClick={onManualClick}
            variant="secondary"
            className="shadow-lg border-2 border-black/80 bg-secondary/70"
          >
            <Keyboard className="w-4 h-4 opacity-100" />
          </Button>
        </div>
      )}
    </div>
  );
};
