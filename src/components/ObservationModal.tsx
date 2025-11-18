import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface ObservationModalProps {
  open: boolean;
  initialText?: string;
  luggageCode?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export const ObservationModal = ({
  open,
  initialText = "",
  luggageCode,
  onSave,
  onCancel,
}: ObservationModalProps) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText, open]);

  const handleSave = () => {
    onSave(text);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Observación {luggageCode && `- Maleta ${luggageCode}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="observation">Descripción del daño</Label>
            <Textarea
              id="observation"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: Rueda rota y rasgado en lateral..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Describe detalladamente los daños observados en la maleta
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
