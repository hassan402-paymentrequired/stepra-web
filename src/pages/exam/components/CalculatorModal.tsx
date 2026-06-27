import { Calculator, X } from "lucide-react";

interface CalculatorModalProps {
  isOpen: boolean;
  display: string;
  onClose: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onPercent: () => void;
  onNumber: (num: string) => void;
  onOperation: (op: string) => void;
  onEquals: () => void;
  onToggleSign: () => void;
  onDecimal: () => void;
}

export const CalculatorModal = ({
  isOpen,
  display,
  onClose,
  onClear,
  onBackspace,
  onPercent,
  onNumber,
  onOperation,
  onEquals,
  onToggleSign,
  onDecimal,
}: CalculatorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-sm border-2 border-border">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculator
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 bg-muted/30 border-b">
          <div className="text-right">
            <div className="text-4xl font-mono font-bold min-h-12 flex items-center justify-end break-all">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {/* Row 1: Clear, Backspace, %, ÷ */}
          <button
            onClick={onClear}
            className="p-4 bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold rounded-lg transition-colors"
          >
            C
          </button>
          <button
            onClick={onBackspace}
            className="p-4 bg-muted hover:bg-muted/80 font-semibold rounded-lg transition-colors"
          >
            ⌫
          </button>
          <button
            onClick={onPercent}
            className="p-4 bg-muted hover:bg-muted/80 font-semibold rounded-lg transition-colors"
          >
            %
          </button>
          <button
            onClick={() => onOperation("÷")}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
          >
            ÷
          </button>

          {/* Row 2: 7, 8, 9, × */}
          <button
            onClick={() => onNumber("7")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            7
          </button>
          <button
            onClick={() => onNumber("8")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            8
          </button>
          <button
            onClick={() => onNumber("9")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            9
          </button>
          <button
            onClick={() => onOperation("×")}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
          >
            ×
          </button>

          {/* Row 3: 4, 5, 6, - */}
          <button
            onClick={() => onNumber("4")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            4
          </button>
          <button
            onClick={() => onNumber("5")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            5
          </button>
          <button
            onClick={() => onNumber("6")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            6
          </button>
          <button
            onClick={() => onOperation("-")}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
          >
            −
          </button>

          {/* Row 4: 1, 2, 3, + */}
          <button
            onClick={() => onNumber("1")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            1
          </button>
          <button
            onClick={() => onNumber("2")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            2
          </button>
          <button
            onClick={() => onNumber("3")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            3
          </button>
          <button
            onClick={() => onOperation("+")}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
          >
            +
          </button>

          {/* Row 5: +/-, 0, ., = */}
          <button
            onClick={onToggleSign}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            +/-
          </button>
          <button
            onClick={() => onNumber("0")}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            0
          </button>
          <button
            onClick={onDecimal}
            className="p-4 bg-card hover:bg-muted font-semibold rounded-lg transition-colors border"
          >
            .
          </button>
          <button
            onClick={onEquals}
            className="col-span-1 rounded-lg bg-primary p-4 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
