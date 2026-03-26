import { useState } from "react";

type CalcKey = string;

const BUTTONS: CalcKey[][] = [
  ["C", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

function formatDisplay(val: string): string {
  if (val.length > 12) return val.slice(0, 12) + "…";
  return val;
}

export default function CalculatorSection() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  const calculate = (a: string, operator: string, b: string): string => {
    const n1 = parseFloat(a);
    const n2 = parseFloat(b);
    let result: number;
    switch (operator) {
      case "+": result = n1 + n2; break;
      case "−": result = n1 - n2; break;
      case "×": result = n1 * n2; break;
      case "÷": result = n2 !== 0 ? n1 / n2 : 0; break;
      default: result = n2;
    }
    const str = parseFloat(result.toPrecision(10)).toString();
    return str;
  };

  const handleKey = (key: CalcKey) => {
    if (key === "C") {
      setDisplay("0");
      setPrev(null);
      setOp(null);
      setFresh(true);
      return;
    }
    if (key === "+/-") {
      setDisplay((d) => d.startsWith("-") ? d.slice(1) : "-" + d);
      return;
    }
    if (key === "%") {
      setDisplay((d) => (parseFloat(d) / 100).toString());
      return;
    }
    if (["+", "−", "×", "÷"].includes(key)) {
      setPrev(display);
      setOp(key);
      setFresh(true);
      return;
    }
    if (key === "=") {
      if (op && prev !== null) {
        const result = calculate(prev, op, display);
        const entry = `${prev} ${op} ${display} = ${result}`;
        setHistory((h) => [entry, ...h].slice(0, 5));
        setDisplay(result);
        setPrev(null);
        setOp(null);
        setFresh(true);
      }
      return;
    }
    if (key === ".") {
      if (fresh) {
        setDisplay("0.");
        setFresh(false);
        return;
      }
      if (!display.includes(".")) setDisplay((d) => d + ".");
      return;
    }
    if (fresh) {
      setDisplay(key);
      setFresh(false);
    } else {
      setDisplay((d) => d === "0" ? key : d + key);
    }
  };

  const isOp = (k: string) => ["+", "−", "×", "÷"].includes(k);
  const isEq = (k: string) => k === "=";

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-[var(--nova-border)]">
        <div className="font-semibold text-[var(--nova-text)] text-sm">Калькулятор</div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Display */}
        <div className="glass rounded-2xl px-5 py-4 text-right">
          {op && prev && (
            <div className="text-xs text-[var(--nova-text-muted)] font-mono-nova mb-1">
              {prev} {op}
            </div>
          )}
          <div className="text-4xl font-semibold text-[var(--nova-text)] font-mono-nova tracking-tight">
            {formatDisplay(display)}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid gap-3">
          {BUTTONS.map((row, ri) => (
            <div
              key={ri}
              className={`grid gap-3 ${
                ri === 4 ? "grid-cols-[1fr_1fr_1fr]" : "grid-cols-4"
              }`}
            >
              {row.map((key) => {
                const isAction = isOp(key) || isEq(key);
                const isActive = op === key;
                const isZero = key === "0" && ri === 4;
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={`calc-btn h-14 rounded-2xl text-base font-medium transition-all select-none
                      ${isZero ? "col-span-2" : ""}
                      ${isEq(key)
                        ? "bg-gradient-to-br from-[#7c6df8] to-[#5b50d6] text-white shadow-lg shadow-[var(--nova-indigo-glow)] hover:shadow-xl"
                        : isOp(key)
                        ? isActive
                          ? "bg-[var(--nova-indigo)] text-white"
                          : "bg-[var(--nova-indigo-dim)] text-[var(--nova-indigo)] hover:bg-[var(--nova-indigo-glow)]"
                        : key === "C" || key === "+/-" || key === "%"
                        ? "glass text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/10"
                        : "glass text-[var(--nova-text)] hover:bg-white/8"
                      }
                    `}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass rounded-2xl p-4 space-y-2">
            <div className="text-xs text-[var(--nova-text-muted)] font-medium mb-3">История вычислений</div>
            {history.map((h, i) => (
              <div key={i} className="text-xs font-mono-nova text-[var(--nova-text-muted)] py-1 border-b border-[var(--nova-border)] last:border-0">
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
