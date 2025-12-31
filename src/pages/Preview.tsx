import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoClearRecords } from "@/hooks/useAutoClearRecords";
import { type LuggageRecord } from "@/types/luggage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Luggage } from "lucide-react";
import { ArrowLeft, Search, Save, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PreviewRecordCard } from "@/components/PreviewRecordCard";
import { ObservationModal } from "@/components/ObservationModal";
import { MetadataModal } from "@/components/MetadataModal";
import { PrintableReport } from "@/components/PrintableReport";
import { toPng } from "html-to-image";
import { toast } from "sonner";

const Preview = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [currentEditingCode, setCurrentEditingCode] = useState<string | null>(null);

  // Metadata for printable report (updated when saving)
  const [reportMetadata, setReportMetadata] = useState({
    user: "Encargado",
    shift: "Turno",
    airline: "Aerolínea",
    dateTime: new Date().toLocaleString("es-ES"),
  });

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

  const handleSaveWithMetadata = async (metadata: {
    user: string;
    shift: string;
    airline: string;
  }) => {
    if (records.length === 0) {
      toast.error("No hay registros para guardar");
      return;
    }

    setIsSaving(true);
    setMetadataModalOpen(false);

    try {
      // Update report metadata for printable report
      setReportMetadata({
        user: metadata.user,
        shift: metadata.shift,
        airline: metadata.airline,
        dateTime: new Date().toLocaleString("es-ES"),
      });

      // Step 1: Generate image
      toast.info("Generando imagen...");
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

      // Step 2: Send to Supabase
      toast.info("Enviando a la base de datos...");
      const transformedRecords = records.map((record) => ({
        codigo: record.code,
        categorias: record.categories,
        observacion: record.observation || null,
        aerolinea: metadata.airline,
        fecha_hora: new Date().toISOString(),
        usuario: metadata.user,
        turno: metadata.shift,
        firma: record.has_signature,
      }));

      const { data, error } = await supabase
        .from("counter")
        .insert(transformedRecords)
        .select();

      if (error) throw error;

      const insertedCount = Array.isArray(data) ? data.length : 0;

      // Step 3: Clear localStorage
      localStorage.removeItem("luggageRecords");
      localStorage.removeItem("luggageMetadata");

      // Step 4: Update local state
      setRecords([]);

      toast.success(
        `✅ Guardado exitoso: ${insertedCount} ${insertedCount === 1 ? "registro" : "registros"} enviado${insertedCount === 1 ? "" : "s"} a la base de datos`
      );
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Error al guardar los registros");
    } finally {
      setIsSaving(false);
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

  const handleOpenSaveModal = () => {
    if (records.length === 0) {
      toast.error("No hay registros para guardar");
      return;
    }
    setMetadataModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleOpenSaveModal}
            disabled={isSaving || records.length === 0}
            className="h-12"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
          <Button
            onClick={() => navigate("/records")}
            className="h-12"
            size="lg"
            variant="secondary"
          >
            <Database className="w-5 h-5 mr-2" />
            Ver Registros
          </Button>
        </div>
      </div>

      {/* Hidden printable report */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <PrintableReport records={records} metadata={reportMetadata} />
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

      {/* Metadata Modal */}
      <MetadataModal
        open={metadataModalOpen}
        recordCount={records.length}
        onSave={handleSaveWithMetadata}
        onCancel={() => setMetadataModalOpen(false)}
      />
    </div>
  );
};

export default Preview;
