import { cn } from "@/lib/utils";
import { Package, Sparkles } from "lucide-react";

interface MysteryBoxProps {
  categoryId: string;
  categoryName?: string;
  isRevealed: boolean;
  isAssigned: boolean; // already taken by another admin
  canPick: boolean;
  onClick: (categoryId: string) => void;
  index: number;
}

export function MysteryBox({
  categoryId,
  categoryName,
  isRevealed,
  isAssigned,
  canPick,
  onClick,
  index,
}: MysteryBoxProps) {
  const handleClick = () => {
    if (!isRevealed && !isAssigned && canPick) {
      onClick(categoryId);
    }
  };

  return (
    <div
      className={cn(
        "mystery-box h-36",
        isRevealed && "flipped",
        !isRevealed && !isAssigned && canPick && "pulse-glow hover:scale-105 transition-transform duration-200"
      )}
      
      onClick={handleClick}
      role={!isRevealed && !isAssigned && canPick ? "button" : undefined}
      aria-label={isRevealed ? `Revealed: ${categoryName}` : "Mystery box – click to reveal"}
    >
      <div className="mystery-box-inner h-full">
        {/* Front – mystery */}
        <div
          className={cn(
            "mystery-box-front h-full border rounded-xl flex flex-col items-center justify-center gap-2 select-none",
            isAssigned
              ? "border-border/30 bg-muted/30 opacity-40 cursor-not-allowed"
              : canPick
              ? "border-primary/30 mystery-shimmer cursor-pointer"
              : "border-border/40 bg-muted/40 cursor-not-allowed opacity-60"
          )}
        >
          {isAssigned ? (
            <>
              <Package className="w-7 h-7 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/40 font-medium">Taken</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Package className="w-8 h-8 text-primary/70" />
                {canPick && (
                  <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-pulse" />
                )}
              </div>
              <span className={cn("text-xs font-semibold tracking-wide", canPick ? "text-primary/80" : "text-muted-foreground/50")}>
                {canPick ? "Click to Reveal" : "Locked"}
              </span>
            </>
          )}
        </div>

        {/* Back – revealed */}
        <div className="mystery-box-back h-full border border-primary/50 rounded-xl bg-[hsl(var(--box-revealed))] flex flex-col items-center justify-center gap-2 select-none glow-primary">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-bold text-primary text-center px-2 leading-tight">
            {categoryName}
          </span>
          <span className="text-xs text-primary/60 font-medium">Assigned ✓</span>
        </div>
      </div>
    </div>
  );
}
