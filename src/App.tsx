import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CounterPage from "./pages/CounterPage";
import Preview from "./pages/Preview";
import SiberiaPage from "./pages/SiberiaPage";
import Records from "./pages/Records";
import NotFound from "./pages/NotFound";
import { PrintableReport } from "@/components/PrintableReport";
import { recordsExample } from "@/utils/records_example";


const App = () => (
  <>
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/counter"
          element={
            <ProtectedRoute>
              <CounterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <Preview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/siberia"
          element={
            <ProtectedRoute>
              <SiberiaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <Records />
            </ProtectedRoute>
          }
        />

        <Route
          path="/printable-records"
          element={
            <ProtectedRoute>
              <PrintableReport
                metadata={{
                  dateTime: "2024-06-01 14:30",
                  user: "Juan Pérez",
                  shift: "Mañana",
                  airline: "Aerolínea XYZ",
                }}
                records={recordsExample}
              />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
