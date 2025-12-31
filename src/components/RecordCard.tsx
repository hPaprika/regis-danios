import { useState } from "react";
import { type LuggageRecord } from "@/types/luggage";
import { Trash2, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface RecordCardProps {
  record: LuggageRecord;
  onToggleCategory: (code: string, category: string) => void;
  onToggleSignature: (code: string) => void;
  onEditObservation: (code: string) => void;
  onDelete: (code: string) => void;
}

export const RecordCard = ({
  record,
  onToggleCategory,
  onToggleSignature,
  onEditObservation,
  onDelete,
}: RecordCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const categories = ["A", "B", "C"];

  return (
    <>
      <div className="bg-card rounded-lg py-2 px-3 shadow-sm border border-border space-y-1.5">
        {/* Header: Code and Time */}
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-primary">{record.code.slice(-6)}</div>
          <div className="text-sm text-muted-foreground">{record.dateTime.split(" ")[1]}</div>
        </div>

        {/* Category toggles */}
        <div className="flex items-center gap-2">
          {categories.map((cat) => {
            const isActive = record.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleCategory(record.code, cat)}
                className={`
                min-w-8 h-8 rounded-md font-medium text-sm border transition-all
                ${isActive
                    ? "bg-primary text-white shadow-md scale-105"
                    : "text-foreground"
                  }
              `}
              >
                {cat}
              </button>
            );
          })}

          {/* Observation badge/button */}
          <button
            onClick={() => onEditObservation(record.code)}
            className="flex-1 h-8 rounded-md border-2 border-muted hover:border-primary transition-colors flex items-center justify-center gap-2 px-3"
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm font-medium">OBS</span>
          </button>

          {/* Delete button (opens confirmation) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Signature checkbox and observation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 shrink-0">
            <Checkbox
              id={`signature-${record.code}`}
              checked={record.has_signature}
              onCheckedChange={() => onToggleSignature(record.code)}
            />
            <Label
              htmlFor={`signature-${record.code}`}
              className="text-sm font-normal cursor-pointer whitespace-nowrap"
            >
              ¿Tiene firma?
            </Label>
          </div>
          {record.observation && (
            <div className="text-sm text-muted-foreground truncate flex-1">
              {record.observation}
            </div>
          )}
        </div>
      </div>
      <Dialog open={confirmOpen} onOpenChange={(open) => setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground my-2">¿Estás seguro de que quieres eliminar el registro <span className="font-medium">{record.code.slice(-6)}</span>? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button className="ml-2" onClick={() => { onDelete(record.code); setConfirmOpen(false); }}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
