interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressDots = ({ currentStep, totalSteps }: ProgressDotsProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === currentStep
              ? "w-6 bg-primary"
              : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
};

export default ProgressDots;
