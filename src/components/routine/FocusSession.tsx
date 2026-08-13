import { useCallback, useState } from "react";
import { Quote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUOTES = [
  "Focus is a muscle. The more you practice, the easier it gets.",
  "Do something today that your future self will thank you for.",
  "Small daily improvements over time lead to stunning results.",
  "It's not about having time, it's about making time.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be extreme, just consistent.",
  "Deep work is the ability to focus without distraction on a demanding task.",
  "Start where you are. Use what you have. Do what you can.",
  "The quieter you become, the more you can hear yourself think.",
  "Progress, not perfection, is the goal of every study session.",
];

export function FocusSession() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const newQuote = useCallback(() => {
    setIndex((current) => {
      if (QUOTES.length < 2) return current;
      let next = current;
      while (next === current) next = Math.floor(Math.random() * QUOTES.length);
      return next;
    });
  }, []);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-5">
      <Quote
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-primary/10"
        aria-hidden
      />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Deep Work Focus
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={newQuote}
          aria-label="Show a new motivational quote"
          title="New quote"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <blockquote
        key={index}
        className="animate-in fade-in duration-500 border-l-2 border-primary/50 pl-4"
      >
        <p className="text-pretty text-[15px] font-light italic leading-relaxed tracking-tight text-foreground/90">
          {QUOTES[index]}
        </p>
      </blockquote>
    </section>
  );
}
