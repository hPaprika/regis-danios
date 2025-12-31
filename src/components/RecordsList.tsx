import { type LuggageRecord } from "@/types/luggage";
import { RecordCard } from "./RecordCard";
import { CategoryLegend } from "./CategoryLegend";
import { Luggage } from "lucide-react";

interface RecordsListProps {
  records: LuggageRecord[];
  onToggleCategory: (code: string, category: string) => void;
  onToggleSignature: (code: string) => void;
  onEditObservation: (code: string) => void;
  onDelete: (code: string) => void;
  showSavedMessage?: boolean;
  savedRecordCount?: number;
}

export const RecordsList = ({
  records,
  onToggleCategory,
  onToggleSignature,
  onEditObservation,
  onDelete,
  showSavedMessage = false,
  savedRecordCount = 0,
}: RecordsListProps) => {
  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
        <Luggage className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {showSavedMessage && savedRecordCount > 0
            ? `${savedRecordCount} ${savedRecordCount === 1 ? "registro guardado" : "registros guardados"}`
            : "No hay maletas escaneadas"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {showSavedMessage && savedRecordCount > 0
            ? "en el almacenamiento local"
            : "Apunta la cámara al código de barras de una maleta para comenzar el registro de daños"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">
          Maletas Escaneadas
        </h2>
        <span className="text-sm text-muted-foreground">
          {records.length} {records.length === 1 ? "maleta" : "maletas"}
        </span>
      </div>

      <CategoryLegend />

      {records.map((record) => (
        <RecordCard
          key={record.code}
          record={record}
          onToggleCategory={onToggleCategory}
          onToggleSignature={onToggleSignature}
          onEditObservation={onEditObservation}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
