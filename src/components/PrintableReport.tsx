import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { type LuggageRecord } from "@/types/luggage";

interface PrintableReportProps {
  records: LuggageRecord[];
  metadata: {
    dateTime: string;
    user: string;
    shift: string;
    airline: string;
  };
}

export const PrintableReport = ({ records, metadata }: PrintableReportProps) => {
  const barcodeRefs = useRef<{ [key: string]: SVGSVGElement | null }>({});

  useEffect(() => {
    records.forEach((record) => {
      const lastSixDigits = record.code.slice(-6);
      const svg = barcodeRefs.current[record.code];
      if (svg) {
        try {
          JsBarcode(svg, lastSixDigits, {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: false,
            margin: 0,
          });
        } catch (error) {
          console.error("Error generating barcode:", error);
        }
      }
    });
  }, [records]);

  // Helper to format date in a more readable way
  const formatReadableDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div
      id="printable-report"
      className="w-[1000px] min-h-[2000px] bg-white p-6 border-2 font-sans"
    >
      {/* Header */}
      <div className="mb-4 border-b-2 border-gray-200 pb-3">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Registro de Daños
          </h1>
          <div className="text-sm text-gray-900">{formatReadableDate(metadata.dateTime)}</div>
        </div>

        <div className="grid grid-cols-3 gap-6 items-center">
          {/* Column 1 */}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 font-semibold">Encargado: </span>
              <span className="text-sm text-gray-900">{metadata.user}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 font-semibold">Total de maletas: </span>
              <span className="text-sm text-gray-900">{records.length}</span>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 font-semibold">Turno: </span>
              <span className="text-sm text-gray-900">{metadata.shift}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 font-semibold">Aerolínea: </span>
              <span className="text-sm text-gray-900">{metadata.airline}</span>
            </div>
          </div>

          {/* Column 3 - Category Legend Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-semibold">A</div>
              <span className="text-xs text-gray-900">Asa rota</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-semibold">B</div>
              <span className="text-xs text-gray-900">Maleta rota</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-semibold">C</div>
              <span className="text-xs text-gray-900">Rueda rota</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-5 gap-4">
        {records.slice().reverse().map((record) => {
          const lastSixDigits = record.code.slice(-6);
          const hasObservation = record.observation && record.observation.trim() !== "";

          return (
            <div
              key={record.code}
              className="border border-gray-200 rounded-lg px-1 py-2 bg-white"
            >
              {/* Barcode */}
              <div className="flex justify-center">
                <svg
                  ref={(el) => {
                    if (el) {
                      barcodeRefs.current[record.code] = el;
                    }
                  }}
                  className="max-w-full"
                />
              </div>

              {/* Code */}
              <div className="text-center text-sm font-semibold text-gray-900 mb-1">
                {lastSixDigits}
              </div>

              {/* Categories */}
              <div className="flex gap-1 justify-center mb-1.5">
                {["A", "B", "C"].map((cat) => (
                  <div
                    key={cat}
                    className={`w-6 h-6 border-2 border-blue-500 rounded flex items-center justify-center text-xs font-semibold ${record.categories.includes(cat)
                      ? "bg-blue-500 text-white"
                      : "bg-white text-blue-500"
                      }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* Observation */}
              <div
                className={`text-[10px] text-center leading-tight wrap-break-words ${hasObservation
                  ? "text-gray-700"
                  : "text-gray-400 italic opacity-70"
                  }`}
              >
                {hasObservation ? record.observation : "Sin observaciones"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
