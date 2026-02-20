import { Package, Star } from "lucide-react";

interface AssignedCategory {
  id: string;
  name: string;
  revealed_at: string;
}

interface AssignedCategoriesProps {
  categories: AssignedCategory[];
}

export function AssignedCategories({ categories }: AssignedCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-6 glow-primary float-in">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-primary">Your Assigned Categories</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                Picked {new Date(cat.revealed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 2 && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            <Star className="w-3 h-3" />
            All 2 categories assigned — you're all set!
          </span>
        </div>
      )}
    </div>
  );
}
