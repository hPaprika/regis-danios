import { Info } from "lucide-react";

export const CategoryLegend = () => {
  const categories = [
    { letter: "A", description: "Asa rota" },
    { letter: "B", description: "Maleta rota" },
    { letter: "C", description: "Rueda rota" },
  ];

  return (
    <div className="bg-card rounded-lg p-2 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Guía de categorías</h3>
      </div>

      <div className="flex justify-center gap-1 flex-wrap">
        {categories.map((cat, index) => (
          <>
            <div key={cat.letter} className="flex items-center">
              <div className="min-w-8 h-4 rounded-md bg-category-active text-black font-medium text-sm flex items-center justify-center">
                {cat.letter}
              </div>
              <span className="text-sm pe-1">{cat.description}</span>
            </div>
            {index < categories.length - 1 && (
              <span className="text-muted-foreground">|</span>
            )}
          </>
        ))}
      </div>
    </div>
  );
};
