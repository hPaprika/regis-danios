import { Button } from "./ui/button";
import { Send, FileText } from "lucide-react";

interface FooterActionsProps {
  recordsCount: number;
  onSend: () => void;
  onPreview: () => void;
  onClear: () => void;
  hasPreviewRecords: boolean;
}

export const FooterActions = ({
  recordsCount,
  onSend,
  onPreview,
  hasPreviewRecords,
}: FooterActionsProps) => {
  const hasRecords = recordsCount > 0;

  return (
    <footer>
      <div className="flex gap-2">
        <Button
          onClick={onSend}
          disabled={!hasRecords}
          className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md disabled:opacity-50"
        >
          <Send className="w-5 h-5 mr-2" />
          Guardar ({recordsCount})
        </Button>

        <Button
          onClick={onPreview}
          disabled={!hasPreviewRecords}
          variant="outline"
          className="flex-1 h-12 text-base font-semibold border-2 disabled:opacity-50"
        >
          <FileText className="w-5 h-5 mr-2" />
          Previsualizar
        </Button>
      </div>
      {/* 
      {hasRecords && (
        <Button
          onClick={onClear}
          variant="ghost"
          className="w-full mt-2 text-sm text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpiar todo
        </Button>
      )}
       */}
    </footer>
  );
};
