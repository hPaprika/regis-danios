import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Camera, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * PhotologPage - Página dedicada para visualizar registros de daños de Siberia
 * Permite navegar por días, buscar registros específicos y ver detalles completos
 */
const PhotologPage = () => {
  const navigate = useNavigate();

  // Estado para la fecha seleccionada (por defecto: hoy)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Estado para los registros del día
  const [records, setRecords] = useState<any[]>([]);

  // Estado para el término de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de carga
  const [isLoading, setIsLoading] = useState(false);

  // Estado para mostrar todos los registros (sin filtro de fecha)
  const [showAll, setShowAll] = useState(false);

  /**
   * Función para obtener registros de Supabase
   * Filtra por fecha seleccionada y término de búsqueda
   * Si showAll es true, muestra todos los registros sin filtro de fecha
   */
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("siberia")
        .select("*")
        .order("created_at", { ascending: false });

      // Si no está en modo "Ver todo", filtrar por fecha
      if (!showAll) {
        // Calcular inicio y fin del día seleccionado
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte("fecha_hora", startOfDay.toISOString())
          .lte("fecha_hora", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por búsqueda en el cliente (código, vuelo, observaciones)
      let filteredData = data || [];
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (record) =>
            record.codigo?.toLowerCase().includes(query) ||
            record.vuelo?.toLowerCase().includes(query) ||
            record.observacion?.toLowerCase().includes(query)
        );
      }

      setRecords(filteredData);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("No se pudieron cargar los registros");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Efecto para cargar registros cuando cambia la fecha, búsqueda o modo showAll
   */
  useEffect(() => {
    fetchRecords();
  }, [selectedDate, searchQuery, showAll]);

  /**
   * Navegar al día anterior
   */
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  /**
   * Navegar al día siguiente
   */
  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  /**
   * Activar modo "Ver todo" para mostrar todos los registros
   */
  const handleShowAll = () => {
    setShowAll(true);
  };

  /**
   * Formatear fecha para mostrar
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Mostrar fecha corta y hora: ej. '26/12/25, 15:37'
   */
  const showShortDate = (input: string | Date) => {
    const d = new Date(input);
    return d.toLocaleString("es-PE", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  /**
   * Verificar si la fecha seleccionada es hoy
   */
  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/siberia")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Registros Fotográficos</h1>
              <p className="text-sm opacity-90">
                {showAll ? "Todos los registros" : formatDate(selectedDate)}
              </p>
            </div>
          </div>
          <Camera className="w-6 h-6" />
        </div>

        {/* Barra de búsqueda */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground/60" />
          <Input
            type="text"
            placeholder="Buscar por código, vuelo u observaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
          />
        </div>
      </header>

      {/* Contenido principal - Lista de registros */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pb-24">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando registros...</p>
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron registros con ese criterio"
                    : "No hay registros para este día"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery
                    ? "Intenta con otro término de búsqueda"
                    : "Los registros aparecerán aquí cuando se creen"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-20">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Información del registro */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Código:</span>{" "}
                        <span className="font-semibold">{record.codigo}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Vuelo:</span>{" "}
                        <span className="font-semibold">{record.vuelo}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Firma:</span>{" "}
                        <span className={record.firma ? "text-green-600 font-medium" : "text-red-600"}>
                          {record.firma ? "Sí" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Fecha:</span>{" "}
                        <span className="text-sm">{showShortDate(record.fecha_hora)}</span>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {record.observacion && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Observaciones:</span>
                        <p className="text-foreground mt-1 bg-muted/50 p-2 rounded">
                          {record.observacion}
                        </p>
                      </div>
                    )}

                    {/* Imagen del daño */}
                    {record.imagen_url && (
                      <div className="mt-3">
                        <img
                          src={record.imagen_url}
                          alt={`Daño ${record.codigo}`}
                          className="w-full h-64 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - Navegación de días */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          {/* Botón día anterior */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousDay}
            disabled={showAll}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {/* Indicador de día actual */}
          <Button
            variant={isToday() ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowAll(false);
              setSelectedDate(new Date());
            }}
            disabled={isToday() && !showAll}
            className="flex-1"
          >
            {isToday() && !showAll ? "Hoy" : "Ir a Hoy"}
          </Button>

          {/* Botón día siguiente o Ver todo */}
          {isToday() && !showAll ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-1" />
              Ver todo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              disabled={showAll}
              className="flex-1"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Contador de registros */}
        <div className="text-center mt-2 text-xs text-muted-foreground">
          {records.length} {records.length === 1 ? "registro" : "registros"} encontrados
        </div>
      </footer>
    </div>
  );
};

export default PhotologPage;
