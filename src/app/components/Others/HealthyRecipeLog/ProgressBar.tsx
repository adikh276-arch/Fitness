const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = (current / total) * 100;
  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right mt-1">{current} / {total}</p>
    </div>
  );
};

export default ProgressBar;
