interface Props {
  level: number;
  active: boolean;
}

const BARS = 24;

export function AudioVisualizer({ level, active }: Props) {
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {Array.from({ length: BARS }).map((_, i) => {
        const wave = Math.sin((i / BARS) * Math.PI);
        const h = active ? Math.max(3, level * 90 * wave + 4) : 3;
        return (
          <span
            key={i}
            className={
              "w-[3px] rounded-full transition-[height] duration-75 " +
              (active ? "bg-primary" : "bg-muted-foreground/40")
            }
            style={{ height: `${Math.min(32, h)}px` }}
          />
        );
      })}
    </div>
  );
}
