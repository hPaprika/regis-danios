import { useState } from "react";
import { type LuggageRecord } from "@/types/luggage";
import { Trash2, Edit, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

interface PreviewRecordCardProps {
  record: LuggageRecord;
  onToggleCategory: (code: string, category: string) => void;
  onToggleSignature: (code: string) => void;
  onEditObservation: (code: string) => void;
  onDelete: (code: string) => void;
}

export const PreviewRecordCard = ({
  record,
  onToggleCategory,
  onToggleSignature,
  onEditObservation,
  onDelete,
}: PreviewRecordCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const categories = ["A", "B", "C"];

  return (
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
              onClick={() => isEditing && onToggleCategory(record.code, cat)}
              disabled={!isEditing}
              className={`
                min-w-8 h-8 rounded-md font-medium text-sm border transition-all
                ${isActive
                  ? "bg-category-active bg-primary text-white shadow-md scale-105"
                  : "bg-category-inactive/30 text-foreground"
                }
                ${!isEditing ? "cursor-default opacity-70" : "hover:bg-category-inactive/40"}
              `}
            >
              {cat}
            </button>
          );
        })}

        {/* Observation badge/button */}
        <button
          onClick={() => isEditing && onEditObservation(record.code)}
          disabled={!isEditing}
          className={`
            flex-1 h-8 rounded-md border-2 border-muted transition-colors flex items-center justify-center gap-2 px-3
            ${isEditing ? "hover:border-primary cursor-pointer" : "cursor-default opacity-70"}
          `}
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">OBS</span>
        </button>

        {/* Edit/Save button */}
        {isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
            className="text-green-600 hover:text-green-600 hover:bg-green-600/10 h-8 w-8"
          >
            <Save className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-600 hover:bg-blue-600/10 h-8 w-8"
          >
            <Edit className="w-5 h-5" />
          </Button>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(record.code)}
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
            onCheckedChange={() => isEditing && onToggleSignature(record.code)}
            disabled={!isEditing}
          />
          <Label
            htmlFor={`signature-${record.code}`}
            className={`text-sm font-normal whitespace-nowrap ${
              isEditing ? "cursor-pointer" : "cursor-default opacity-70"
            }`}
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
  );
};
