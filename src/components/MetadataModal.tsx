import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { User, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface MetadataModalProps {
  open: boolean;
  recordCount: number;
  onSave: (metadata: { user: string; shift: string; airline: string }) => void;
  onCancel: () => void;
}

// Función para obtener el turno por defecto según la hora actual
const getDefaultShift = (): string => {
  const now = new Date();
  const hour = now.getHours();
  // BRC-ERC: 4:00 - 12:59
  // IRC-KRC: 13:00 - 23:59
  return hour >= 4 && hour < 13 ? "BRC-ERC" : "IRC-KRC";
};

// Función para validar si se puede guardar en el horario actual según el turno
const canSaveAtCurrentTime = (shift: string): { canSave: boolean; message: string } => {
  const now = new Date();
  const hour = now.getHours();

  if (shift === "BRC-ERC") {
    // Puede guardar desde las 12:00
    const canSave = hour >= 12 || hour < 4;
    return {
      canSave,
      message: canSave
        ? ""
        : "El turno BRC-ERC solo puede guardar registros a partir de las 12:00",
    };
  } else {
    // IRC-KRC: Puede guardar desde las 21:00
    const canSave = hour >= 21 || hour < 4;
    return {
      canSave,
      message: canSave
        ? ""
        : "El turno IRC-KRC solo puede guardar registros a partir de las 21:00",
    };
  }
};

export const MetadataModal = ({
  open,
  recordCount,
  onSave,
  onCancel,
}: MetadataModalProps) => {
  const [user, setUser] = useState("");
  const [shift, setShift] = useState(getDefaultShift());
  const [airline, setAirline] = useState("LATAM");
  const [error, setError] = useState("");

  // Resetear el turno cuando se abre el modal
  useEffect(() => {
    if (open) {
      setShift(getDefaultShift());
      setUser("");
      setAirline("LATAM");
      setError("");
    }
  }, [open]);

  const handleSave = () => {
    // Validar que el encargado no esté vacío
    if (!user.trim()) {
      setError("El campo Encargado es obligatorio");
      return;
    }

    // Validar horario según turno
    const timeValidation = canSaveAtCurrentTime(shift);
    if (!timeValidation.canSave) {
      setError(timeValidation.message);
      return;
    }

    // Guardar metadata
    onSave({
      user: user.trim(),
      shift,
      airline,
    });
  };

  const timeValidation = canSaveAtCurrentTime(shift);
  const showLowRecordWarning = recordCount < 50;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Guardado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia de pocos registros */}
          {showLowRecordWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Solo hay {recordCount} {recordCount === 1 ? "registro" : "registros"}.
                Se recomienda un mínimo de 50 registros por turno.
              </AlertDescription>
            </Alert>
          )}

          {/* Advertencia de horario */}
          {!timeValidation.canSave && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>{timeValidation.message}</AlertDescription>
            </Alert>
          )}

          {/* Error de validación */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Campo Encargado */}
          <div>
            <Label htmlFor="encargado" className="text-sm font-medium">
              Encargado <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-2.5 top-3 size-4 text-muted-foreground" />
              <Input
                id="encargado"
                type="text"
                placeholder="Apellido del encargado"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setError("");
                }}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Turno */}
          <div>
            <Label htmlFor="turno" className="text-sm font-medium">
              Turno
            </Label>
            <Select
              value={shift}
              onValueChange={(value) => {
                setShift(value);
                setError("");
              }}
            >
              <SelectTrigger id="turno" className="mt-1.5">
                <SelectValue placeholder="Seleccionar turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRC-ERC">BRC-ERC (04:00 - 12:59)</SelectItem>
                <SelectItem value="IRC-KRC">IRC-KRC (13:00 - 23:59)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo Aerolínea */}
          <div>
            <Label htmlFor="aerolinea" className="text-sm font-medium">
              Aerolínea
            </Label>
            <Select value={airline} onValueChange={setAirline}>
              <SelectTrigger id="aerolinea" className="mt-1.5">
                <SelectValue placeholder="Seleccionar aerolínea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LATAM">LATAM</SelectItem>
                <SelectItem value="SKY">SKY</SelectItem>
                <SelectItem value="JET SMART">JET SMART</SelectItem>
                <SelectItem value="AVIANCA">AVIANCA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumen */}
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Resumen:</p>
            <p className="text-muted-foreground">
              Se guardarán {recordCount} {recordCount === 1 ? "registro" : "registros"} y se
              enviará{recordCount === 1 ? "" : "n"} a la base de datos.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!timeValidation.canSave}
          >
            Guardar y Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
