import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CounterRecord {
  id: string;
  codigo: string;
  categorias: string[];
  observacion: string | null;
  firma: boolean;
  usuario: string | null;
  turno: string;
  aerolinea: string;
  fecha_hora: string;
  created_at: string;
}

const Records = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<CounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const RECORDS_PER_PAGE = 20;

  useEffect(() => {
    fetchRecords(true);
  }, []);

  const fetchRecords = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = isInitial ? 0 : page;
      const from = currentPage * RECORDS_PER_PAGE;
      const to = from + RECORDS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("counter")
        .select("*", { count: 'exact' })
        .order("fecha_hora", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newRecords = data || [];
      
      if (isInitial) {
        setRecords(newRecords);
      } else {
        setRecords(prev => [...prev, ...newRecords]);
      }

      // Check if there are more records
      setHasMore(newRecords.length === RECORDS_PER_PAGE);
      setPage(currentPage + 1);
    } catch (error: any) {
      console.error("Error fetching records:", error);
      toast.error("Error al cargar los registros");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return records;
    }

    const query = searchQuery.toLowerCase();
    return records.filter((record) => {
      return (
        record.codigo.toLowerCase().includes(query) ||
        record.categorias.some((cat) => cat.toLowerCase().includes(query)) ||
        record.observacion?.toLowerCase().includes(query) ||
        record.usuario?.toLowerCase().includes(query) ||
        record.turno.toLowerCase().includes(query) ||
        record.aerolinea.toLowerCase().includes(query)
      );
    });
  }, [records, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={() => navigate("/preview")}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5" />
              Registros Guardados
            </h1>
            <p className="text-sm text-muted-foreground">
              {records.length} {records.length === 1 ? "registro" : "registros"} en la base de datos
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por código, categoría, encargado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </header>

      {/* Records Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? "No se encontraron resultados" : "No hay registros"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Aún no hay registros en la base de datos"}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 sticky left-0 bg-background z-10">Código</TableHead>
                  <TableHead className="min-w-32">Categorías</TableHead>
                  <TableHead className="min-w-28">Encargado</TableHead>
                  <TableHead className="min-w-24">Turno</TableHead>
                  <TableHead className="min-w-24">Aerolínea</TableHead>
                  <TableHead className="min-w-20">Firma</TableHead>
                  <TableHead className="min-w-36">Fecha</TableHead>
                  <TableHead className="min-w-48">Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono font-bold text-primary sticky left-0 bg-background z-10">
                      {record.codigo.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {record.categorias.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{record.usuario || "N/A"}</TableCell>
                    <TableCell className="text-sm">{record.turno}</TableCell>
                    <TableCell className="text-sm">{record.aerolinea}</TableCell>
                    <TableCell>
                      {record.firma ? (
                        <Badge variant="default" className="text-xs">Sí</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(record.fecha_hora).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs">
                      {record.observacion || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Load More Button */}
        {!loading && !searchQuery && hasMore && filteredRecords.length > 0 && (
          <div className="flex justify-center p-4 border-t">
            <Button
              onClick={() => fetchRecords(false)}
              disabled={loadingMore}
              variant="outline"
              size="sm"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar más registros"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
