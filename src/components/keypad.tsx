"use client";

interface KeypadProps {
  actionKeys: [string, string];
  onDigit: (digit: string) => void;
  onAction: (action: string) => void;
}

const DIGIT_ROWS = ["123", "456", "789"];

export function Keypad({ actionKeys, onDigit, onAction }: KeypadProps) {
  const [leftAction, rightAction] = actionKeys;

  const keyClass =
    "rounded-[10px] border border-line bg-white py-3.5 transition-colors hover:border-muted active:bg-tint";

  return (
    <div className="grid grid-cols-3 gap-3">
      {DIGIT_ROWS.flatMap((row) => row.split("")).map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          className={`${keyClass} font-serif text-2xl`}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onAction(leftAction)}
        className={`${keyClass} mono-label`}
      >
        {leftAction}
      </button>
      <button
        type="button"
        onClick={() => onDigit("0")}
        className={`${keyClass} font-serif text-2xl`}
      >
        0
      </button>
      <button
        type="button"
        onClick={() => onAction(rightAction)}
        className={`${keyClass} mono-label`}
      >
        {rightAction}
      </button>
    </div>
  );
}
