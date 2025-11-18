import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fixed username (hidden from user)
  const USERNAME = "chemoranxv5@gmail.com";

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const validatePassword = (pwd: string): boolean => {
    // Must be exactly 6 alphanumeric characters (letters, numbers, symbols)
    return pwd.length === 6 && /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(pwd);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      toast.error("La contraseña debe tener exactamente 6 caracteres alfanuméricos");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: USERNAME,
        password: password,
      });

      if (error) {
        // If user doesn't exist, create it
        if (error.message.includes("Invalid login credentials")) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: USERNAME,
            password: password,
          });

          if (signUpError) {
            toast.error("Error al crear usuario. Intenta nuevamente.");
          } else {
            toast.success("Usuario creado exitosamente");
            navigate("/");
          }
        } else {
          toast.error("Contraseña incorrecta");
        }
      } else if (data.session) {
        navigate("/");
      }
    } catch (error) {
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">RegisDaños</h1>
          <p className="text-muted-foreground">Ingresa tu contraseña para continuar</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-wider"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Ingresa 6 caracteres (letras, números o símbolos)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || password.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;

// Air_25