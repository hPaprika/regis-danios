import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Home, Scan, Upload, X, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScannerView } from "@/components/ScannerView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const SiberiaPage = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [code, setCode] = useState("");
  const [fullCode, setFullCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [observations, setObservations] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commonFlights = ["2328", "2010", "2366"];

  // Helper: compress image using canvas (client-side)
  const compressImage = async (
    file: File,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    outputType: string = "image/jpeg"
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          // If converting to jpeg, paint white background to avoid black on transparency
          if (outputType === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            },
            outputType,
            quality
          );
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const { data, error } = await supabase
        .from("siberia")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("No se pudieron cargar los registros");
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleOpenRecords = () => {
    setShowRecords(true);
    fetchRecords();
  };

  const handleScan = (scannedCode: string, isSuccess: boolean) => {
    if (isSuccess && scannedCode) {
      // Save full code internally, display last 6 digits
      setFullCode(scannedCode);
      setCode(scannedCode.slice(-6));
      setIsScanning(false);
      toast.success(`Código escaneado: ${scannedCode.slice(-6)}`);
    }
  };

  // const handleManualCode = (manualCode: string) => {
  //   setCode(manualCode);
  //   setFullCode(manualCode);
  //   setShowManualEntry(false);
  //   toast.success(`Código ingresado: ${manualCode}`);
  // };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate it's an image
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetakePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      toast.error("El código debe tener exactamente 6 dígitos numéricos");
      return;
    }

    if (!flightNumber || flightNumber.length !== 4 || !/^\d+$/.test(flightNumber)) {
      toast.error("El número de vuelo debe tener exactamente 4 dígitos numéricos");
      return;
    }

    if (!photoFile) {
      toast.error("La foto es obligatoria");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Compress/convert image before upload (convert to jpeg by default)
      const outputType = "image/jpeg"; // change to 'image/png' if transparency needed
      const compressedBlob = await compressImage(photoFile, 1280, 1280, 0.75, outputType);
      const extension = String(outputType).startsWith("image/png") ? "png" : "jpg";
      const photoFileName = `${Date.now()}_${code}.${extension}`;
      const uploadFile = new File([compressedBlob], photoFileName, { type: outputType });

      // 2. Upload compressed photo to storage
      const { error: uploadError } = await supabase.storage
        .from("siberia_photos")
        .upload(photoFileName, uploadFile, {
          contentType: uploadFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        toast.error(`Error al subir la foto: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }

      // 3. Get public URL of the photo
      const { data: urlData } = supabase.storage
        .from("siberia_photos")
        .getPublicUrl(photoFileName);

      // 4. Insert record into database
      const { error: dbError } = await supabase
        .from("siberia")
        .insert({
          codigo: code,
          vuelo: flightNumber,
          firma: hasSignature,
          imagen_url: urlData.publicUrl,
          observacion: observations || null,
          fecha_hora: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Error inserting record:", dbError);
        toast.error(`Error al guardar el registro: ${dbError.message}`);
        // Photo is already in storage: remove it to avoid orphan files
        try {
          const { error: removeError } = await supabase.storage.from("siberia_photos").remove([photoFileName]);
          if (removeError) console.warn('Failed to remove uploaded photo after DB error:', removeError, fullCode);
        } catch (remErr) {
          console.warn('Unexpected error while removing uploaded photo:', remErr);
        }
        setIsUploading(false);
        return;
      }

      // Success!
      toast.success("¡Registro exitoso! El daño de maleta ha sido registrado correctamente");

      // Clear form
      setCode("");
      setFullCode("");
      setFlightNumber("");
      setHasSignature(false);
      setObservations("");
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Error inesperado al procesar el registro");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Siberia - Registro de Daños</h1>
              <p className="text-sm opacity-90">Escanea y documenta el daño</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenRecords}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Scanner View (only when scanning) */}
      {isScanning && (
        <div className="relative">
          <ScannerView onScan={handleScan} showManualButton={false} />
          <Button
            variant="destructive"
            className="absolute bottom-4 right-4 z-10"
            onClick={() => setIsScanning(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Main Form */}
      {!isScanning && (
        <div className="p-6 max-w-md mx-auto space-y-6">
          {/* Code Section */}
          <div className="space-y-3">
            <Label htmlFor="code">Código de Maleta</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                type="text"
                maxLength={6}
                pattern="\d*"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCode(value);
                  setFullCode(value);
                }}
                className="text-lg text-center tracking-wider"
                disabled={isUploading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsScanning(true)}
                disabled={isUploading}
              >
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Flight Number */}
          <div className="space-y-2">
            <Label htmlFor="flight">Número de Vuelo</Label>
            <Input
              id="flight"
              type="text"
              maxLength={4}
              pattern="\d*"
              inputMode="numeric"
              placeholder="0000"
              list="common-flights"
              value={flightNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setFlightNumber(value);
              }}
              className="text-lg text-center tracking-wider"
              disabled={isUploading}
            />
            <datalist id="common-flights">
              {commonFlights.map((flight) => (
                <option key={flight} value={flight} />
              ))}
            </datalist>
          </div>

          {/* Signature Toggle */}
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="signature"
              checked={hasSignature}
              onCheckedChange={(checked) => setHasSignature(checked as boolean)}
              disabled={isUploading}
            />
            <Label
              htmlFor="signature"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              ¿Tiene firma del pasajero?
            </Label>
          </div>

          {/* Photo Capture */}
          <div className="space-y-3">
            <Label>Foto del Daño (Obligatorio)</Label>

            {!photoPreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar Foto
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRetakePhoto}
                    disabled={isUploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retomar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              placeholder="Ingrese observaciones sobre el daño..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={isUploading}
              className="min-h-24 resize-none"
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium">Subiendo...</p>
            <p className="text-sm text-muted-foreground">Por favor espera</p>
          </div>
        </div>
      )}

      {/* Records Dialog */}
      <Dialog open={showRecords} onOpenChange={setShowRecords}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Registros de Daños</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {isLoadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay registros guardados
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Código:</span>{" "}
                        {record.codigo}
                      </div>
                      <div>
                        <span className="font-medium">Vuelo:</span>{" "}
                        {record.vuelo}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(record.fecha_hora).toLocaleString("es-CL")}
                      </div>
                      <div>
                        <span className="font-medium">Firma:</span>{" "}
                        {record.firma ? "Sí" : "No"}
                      </div>
                    </div>
                    {record.observacion && (
                      <div className="text-sm">
                        <span className="font-medium">Observaciones:</span>
                        <p className="text-muted-foreground mt-1">
                          {record.observacion}
                        </p>
                      </div>
                    )}
                    {record.imagen_url && (
                      <div>
                        <img
                          src={record.imagen_url}
                          alt={`Daño ${record.codigo}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiberiaPage;
