import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import counterImage from "@/assets/counter-card.webp";
import siberiaImage from "@/assets/siberia-card.webp";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Logout button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      <header className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sistema de Gestión</h1>
        <p className="text-muted-foreground">Selecciona una opción</p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate("/counter")}
        >
          <CardHeader className="p-0">
            <img
              src={counterImage}
              alt="Counter"
              className="w-full h-48 object-cover rounded-t-lg"
            />
          </CardHeader>
          <CardContent className="pb-3">
            <CardTitle className="text-2xl mb-2">Counter</CardTitle>
            <CardDescription className="text-base">
              Registrar maletas dañadas
            </CardDescription>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate("/siberia")}
        >
          <CardHeader className="p-0">
            <img
              src={siberiaImage}
              alt="Siberia"
              className="w-full h-48 object-cover rounded-t-lg"
            />
          </CardHeader>
          <CardContent className="pb-3">
            <CardTitle className="text-2xl mb-2">Siberia</CardTitle>
            <CardDescription className="text-base">
              Observación y reporte de daños
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
