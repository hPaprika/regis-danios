import { useState, useEffect } from "react";
import { ManualCodeModal } from "@/components/ManualCodeModal";
import { ObservationModal } from "@/components/ObservationModal";
import { useNavigate } from "react-router-dom";
import { useAutoClearRecords } from "@/hooks/useAutoClearRecords";
import { type LuggageRecord } from "@/types/luggage";
import { Header } from "@/components/Header";
import { ScannerView } from "@/components/ScannerView";
import { RecordsList } from "@/components/RecordsList";
import { FooterActions } from "@/components/FooterActions";
import { toast } from "sonner";
import { playSuccessBeep, playErrorBeep } from "@/utils/sounds";

const Index = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<LuggageRecord[]>(() => {
    // Load current working records from localStorage on mount
    const saved = localStorage.getItem("currentRecords");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [savedRecordCount, setSavedRecordCount] = useState(0);
  const [manualCodeModalOpen, setManualCodeModalOpen] = useState(false);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [currentEditingCode, setCurrentEditingCode] = useState<string | null>(null);

  // Auto-save current working records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("currentRecords", JSON.stringify(records));
  }, [records]);

  // Auto-clear luggageRecords at 23:59:59
  useAutoClearRecords();

  // Get current date and time in format DD/MM/YYYY HH:MM
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} ${time}`;
  };

  const handleManualCodeSubmit = (code: string) => {
    // Reuse existing scan logic
    handleScan(code);
    setManualCodeModalOpen(false);
  };

  const handleScan = (code: string) => {
    setRecords((prev) => {
      const isDuplicate = prev.some((r) => r.code === code);

      if (isDuplicate) {
        playErrorBeep();
        toast.error(`Código duplicado: La maleta ${code.slice(-6)} ya fue escaneada`);
        return prev;
      }

      const newRecord: LuggageRecord = {
        code,
        categories: [],
        observation: "",
        dateTime: getCurrentDateTime(),
        has_signature: true,
      };

      playSuccessBeep();
      toast.success(`Maleta registrada: ${code.slice(-6)}`);

      setShowSavedMessage(false);
      return [newRecord, ...prev];
    });
  };

  const handleToggleCategory = (code: string, category: string) => {
    setRecords((prev) =>
      prev.map((record) => {
        if (record.code === code) {
          const hasCategory = record.categories.includes(category);
          return {
            ...record,
            categories: hasCategory
              ? record.categories.filter((c) => c !== category)
              : [...record.categories, category],
          };
        }
        return record;
      })
    );
  };

  const handleToggleSignature = (code: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.code === code
          ? { ...record, has_signature: !record.has_signature }
          : record
      )
    );
  };

  const handleEditObservation = (code: string) => {
    setCurrentEditingCode(code);
    setObservationModalOpen(true);
  };

  const handleSaveObservation = (text: string) => {
    if (currentEditingCode) {
      setRecords((prev) =>
        prev.map((record) =>
          record.code === currentEditingCode
            ? { ...record, observation: text }
            : record
        )
      );
    }
    setObservationModalOpen(false);
    setCurrentEditingCode(null);
  };

  const handleDelete = (code: string) => {
    setRecords((prev) => prev.filter((r) => r.code !== code));
    toast.success("Maleta eliminada");
  };

  const handleSend = () => {
    // Load existing metadata or create new one
    const existingMetadata = localStorage.getItem("luggageMetadata");
    const metadata = existingMetadata
      ? JSON.parse(existingMetadata)
      : {
        user: "desconocido",
        shift: "---",
        airline: "---",
      };

    // Save to localStorage
    localStorage.setItem("luggageRecords", JSON.stringify(records));
    localStorage.setItem("luggageMetadata", JSON.stringify(metadata));

    toast.success(`Datos guardados: ${records.length} maletas guardadas en el dispositivo`);

    console.log("Saved records:", records);
    console.log("Saved metadata:", metadata);

    // Clear interface but show saved message
    setSavedRecordCount(records.length);
    setShowSavedMessage(true);
    setRecords([]);
    localStorage.removeItem("currentRecords");
  };

  const handlePreview = () => {
    navigate("/preview");
  };

  // Check if there are saved records in localStorage
  const hasSavedRecords = () => {
    const saved = localStorage.getItem("luggageRecords");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleClear = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar todos los registros?")) {
      setRecords([]);
      localStorage.removeItem("currentRecords");
      localStorage.removeItem("luggageRecords");
      toast.success("Registros eliminados: Todos los datos han sido borrados");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <ScannerView 
        onScan={handleScan} 
        showManualButton={true}
        onManualClick={() => setManualCodeModalOpen(true)}
      />

      <RecordsList
        records={records}
        onToggleCategory={handleToggleCategory}
        onToggleSignature={handleToggleSignature}
        onEditObservation={handleEditObservation}
        onDelete={handleDelete}
        showSavedMessage={showSavedMessage}
        savedRecordCount={savedRecordCount}
      />

      <FooterActions
        recordsCount={records.length}
        onSend={handleSend}
        onPreview={handlePreview}
        onClear={handleClear}
        hasPreviewRecords={hasSavedRecords()}
      />

      <ManualCodeModal
        open={manualCodeModalOpen}
        onSubmit={handleManualCodeSubmit}
        onCancel={() => setManualCodeModalOpen(false)}
      />

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

export default Index;
