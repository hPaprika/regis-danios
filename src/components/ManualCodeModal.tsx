import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ManualCodeModalProps {
  open: boolean;
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

export const ManualCodeModal = ({ open, onSubmit, onCancel }: ManualCodeModalProps) => {
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    if (code.length === 6 && /^\d+$/.test(code)) {
      onSubmit(code);
      setCode("");
    }
  };

  const handleCancel = () => {
    setCode("");
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingresar Código Manualmente</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="manual-code">Código (6 dígitos)</Label>
          <Input
            id="manual-code"
            type="text"
            maxLength={6}
            pattern="\d*"
            inputMode="numeric"
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCode(value);
            }}
            className="mt-2 text-lg text-center tracking-wider"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={code.length !== 6}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
