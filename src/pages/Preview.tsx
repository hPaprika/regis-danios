import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoClearRecords } from "@/hooks/useAutoClearRecords";
import { type LuggageRecord } from "@/types/luggage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Luggage, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Image, Trash2, Upload, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PreviewRecordCard } from "@/components/PreviewRecordCard";
import { ObservationModal } from "@/components/ObservationModal";
import { PrintableReport } from "@/components/PrintableReport";
import { toPng } from "html-to-image";
import { toast } from "sonner";

const Preview = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [currentEditingCode, setCurrentEditingCode] = useState<string | null>(null);

  // Load records from localStorage
  const [records, setRecords] = useState<LuggageRecord[]>(() => {
    const saved = localStorage.getItem("luggageRecords");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure categories is always an array and all required fields exist
        return parsed.map((record: any) => ({
          code: record.code || "",
          categories: Array.isArray(record.categories)
            ? record.categories
            : typeof record.categories === 'string'
              ? record.categories.split(',').map((c: string) => c.trim()).filter(Boolean)
              : [],
          observation: record.observation || "",
          dateTime: record.dateTime || new Date().toLocaleString("es-ES"),
          has_signature: record.has_signature !== undefined ? record.has_signature : true,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Load metadata from localStorage or use defaults
  const [metadata, setMetadata] = useState(() => {
    const saved = localStorage.getItem("luggageMetadata");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          dateTime: parsed.dateTime || new Date().toLocaleString("es-ES"),
        };
      } catch {
        return {
          user: "desconocido",
          shift: "BRC-ERC",
          airline: "LATAM",
          dateTime: new Date().toLocaleString("es-ES"),
        };
      }
    }
    return {
      user: "desconocido",
      shift: "BRC-ERC",
      airline: "LATAM",
      dateTime: new Date().toLocaleString("es-ES"),
    };
  });

  // Image metadata to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("luggageMetadata", JSON.stringify(metadata));
  }, [metadata]);

  // Auto-clear luggageRecords at 23:59:59
  const handleAutoClear = useCallback(() => {
    setRecords([]);
    toast.info("Los registros han sido limpiados automáticamente (fin del día)");
  }, []);

  useAutoClearRecords(handleAutoClear);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return records;
    }

    const query = searchQuery.toLowerCase();
    return records.filter((record) => {
      return (
        record.code.toLowerCase().includes(query) ||
        record.categories.some((cat) => cat.toLowerCase().includes(query)) ||
        record.observation.toLowerCase().includes(query)
      );
    });
  }, [records, searchQuery]);

  const handleGenerateImage = async () => {
    if (records.length === 0) {
      toast.error("No hay registros para guardar");
      return;
    }

    setIsGenerating(true);
    try {
      // Wait a bit for barcodes to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = document.getElementById("printable-report");
      if (!element) {
        throw new Error("No se encontró el elemento a exportar");
      }

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const currentDate = new Date()
        .toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(/[/:]/g, "-")
        .replace(/,/g, "")
        .replace(/\s/g, "_");

      link.download = `daños_${currentDate}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Imagen generada exitosamente");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Error al generar la imagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleCategory = (code: string, category: string) => {
    setRecords((prevRecords) => {
      const updated = prevRecords.map((record) => {
        if (record.code === code) {
          const categories = record.categories.includes(category)
            ? record.categories.filter((c) => c !== category)
            : [...record.categories, category];
          return { ...record, categories };
        }
        return record;
      });
      localStorage.setItem("luggageRecords", JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleSignature = (code: string) => {
    setRecords((prevRecords) => {
      const updated = prevRecords.map((record) =>
        record.code === code
          ? { ...record, has_signature: !record.has_signature }
          : record
      );
      localStorage.setItem("luggageRecords", JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditObservation = (code: string) => {
    setCurrentEditingCode(code);
    setObservationModalOpen(true);
  };

  const handleSaveObservation = (text: string) => {
    if (currentEditingCode) {
      setRecords((prevRecords) => {
        const updated = prevRecords.map((record) =>
          record.code === currentEditingCode
            ? { ...record, observation: text }
            : record
        );
        localStorage.setItem("luggageRecords", JSON.stringify(updated));
        return updated;
      });
    }
    setObservationModalOpen(false);
    setCurrentEditingCode(null);
  };

  const handleDelete = (code: string) => {
    setRecords((prevRecords) => {
      const updated = prevRecords.filter((record) => record.code !== code);
      localStorage.setItem("luggageRecords", JSON.stringify(updated));
      return updated;
    });
    toast.success("Registro eliminado");
  };

  const handleSyncToSupabase = async () => {
    if (records.length === 0) {
      toast.error("No hay registros para sincronizar");
      return;
    }

    setIsSyncing(true);
    try {
      // Transform records to match database schema
      const transformedRecords = records.map(record => ({
        codigo: record.code,
        categorias: record.categories,
        observacion: record.observation || null,
        aerolinea: metadata.airline,
        fecha_hora: new Date().toISOString(),
        usuario: metadata.user === 'desconocido' ? null : metadata.user,
        turno: metadata.shift,
        firma: record.has_signature,
      }));

      // Insert directly into the counter table
      const { data, error } = await supabase
        .from('counter')
        .insert(transformedRecords)
        .select();

      if (error) throw error;

      const insertedCount = Array.isArray(data) ? data.length : 0;
      toast.success(`${insertedCount} registros sincronizados exitosamente`);

      // Optionally clear localStorage after successful sync
      // localStorage.removeItem("luggageRecords");
      // localStorage.removeItem("luggageMetadata");
    } catch (error: any) {
      console.error("Error syncing to Supabase:", error);
      toast.error(error.message || "Error al sincronizar con la base de datos");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = () => {
    localStorage.removeItem("luggageRecords");
    localStorage.removeItem("luggageMetadata");
    toast.success("Todos los registros han sido eliminados");
    navigate("/counter");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Button
            onClick={() => navigate("/counter")}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              Registros guardados
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Luggage className="size-4" />
              <span>
                {records.length} {records.length === 1 ? "maleta" : "maletas"}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="space-y-2.5 mb-2">
          <div className="flex justify-between gap-4">
            <div>
              <Label htmlFor="encargado" className="text-xs text-muted-foreground mb-1 block">
                Encargado
              </Label>
              <div className="relative">
                <User className="absolute left-1.5 top-3 size-4 text-muted-foreground" />
                <Input
                  id="encargado"
                  type="text"
                  placeholder="Apellido"
                  value={metadata.user === "desconocido" ? "" : metadata.user}
                  onChange={(e) =>
                    setMetadata((prev: typeof metadata) => ({
                      ...prev,
                      user: e.target.value.trim() || "desconocido",
                    }))
                  }
                  className="pl-6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="turno" className="text-xs text-muted-foreground mb-1 block">
                Turno
              </Label>
              <Select
                value={metadata.shift}
                onValueChange={(value) =>
                  setMetadata((prev: typeof metadata) => ({ ...prev, shift: value }))
                }
              >
                <SelectTrigger id="turno" className="h-9">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRC-ERC">BRC-ERC</SelectItem>
                  <SelectItem value="IRC-KRC">IRC-KRC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="aerolinea" className="text-xs text-muted-foreground mb-1 block">
                Aerolínea
              </Label>
              <Select
                value={metadata.airline}
                onValueChange={(value) =>
                  setMetadata((prev: typeof metadata) => ({ ...prev, airline: value }))
                }
              >
                <SelectTrigger id="aerolinea" className="h-9">
                  <SelectValue placeholder="Aerolínea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LATAM">LATAM</SelectItem>
                  <SelectItem value="SKY">SKY</SelectItem>
                  <SelectItem value="JET SMART">JET SMART</SelectItem>
                  <SelectItem value="AVIANCA">AVIANCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por código, categoría u observación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? "No se encontraron resultados" : "No hay maletas"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Vuelve atrás para escanear maletas"}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <PreviewRecordCard
              key={record.code}
              record={record}
              onToggleCategory={handleToggleCategory}
              onToggleSignature={handleToggleSignature}
              onEditObservation={handleEditObservation}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card px-4 shadow-lg">
        <div className="space-y-2 grid grid-cols-2 gap-x-3">
            <Button
              onClick={handleGenerateImage}
              disabled={isGenerating || records.length === 0}
              className="flex-1 h-12"
              size="lg"
            >
              <Image className="w-5 h-5 mr-2" />
              {isGenerating ? "Generando..." : "Guardar"}
            </Button>
            <Button
              onClick={handleClearAll}
              variant="destructive"
              className="flex-1 h-12"
              size="lg"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Eliminar
            </Button>
          <Button
            onClick={handleSyncToSupabase}
            disabled={isSyncing || records.length === 0}
            className="w-full h-12"
            size="lg"
            variant="outline"
          >
            <Upload className="w-5 h-5 mr-2" />
            {isSyncing ? "Sincronizando..." : "Enviar"}
          </Button>
          <Button
            onClick={() => navigate("/records")}
            className="w-full h-12"
            size="lg"
            variant="secondary"
          >
            <Database className="w-5 h-5 mr-2" />
            Ver
          </Button>
        </div>
      </div>

      {/* Hidden printable report */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <PrintableReport records={records} metadata={metadata} />
      </div>

      {/* Observation Modal */}
      <ObservationModal
        open={observationModalOpen}
        initialText={records.find((r) => r.code === currentEditingCode)?.observation || ""}
        luggageCode={currentEditingCode?.slice(-6)}
        onSave={handleSaveObservation}
        onCancel={() => {
          setObservationModalOpen(false);
          setCurrentEditingCode(null);
        }}
      />
    </div>
  );
};

export default Preview;
