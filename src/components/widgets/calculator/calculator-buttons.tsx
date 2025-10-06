import { Button } from '@/components/ui/button';

interface CalculatorButtonsProps {
  onNumberClick: (num: string) => void;
  onOperationClick: (op: string) => void;
  onClear: () => void;
  onCalculate: () => void;
}

/**
 * 計算機按鈕區元件
 */
export const CalculatorButtons = ({
  onNumberClick,
  onOperationClick,
  onClear,
  onCalculate,
}: CalculatorButtonsProps) => {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <Button
        variant="outline"
        onClick={onClear}
        className="col-span-2 h-9 text-xs rounded-lg"
      >
        清除
      </Button>
      <Button
        variant="outline"
        onClick={() => onOperationClick('÷')}
        className="h-9 text-xs rounded-lg"
      >
        ÷
      </Button>
      <Button
        variant="outline"
        onClick={() => onOperationClick('×')}
        className="h-9 text-xs rounded-lg"
      >
        ×
      </Button>

      <Button
        variant="outline"
        onClick={() => onNumberClick('7')}
        className="h-9 text-sm rounded-lg"
      >
        7
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('8')}
        className="h-9 text-sm rounded-lg"
      >
        8
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('9')}
        className="h-9 text-sm rounded-lg"
      >
        9
      </Button>
      <Button
        variant="outline"
        onClick={() => onOperationClick('-')}
        className="h-9 text-xs rounded-lg"
      >
        -
      </Button>

      <Button
        variant="outline"
        onClick={() => onNumberClick('4')}
        className="h-9 text-sm rounded-lg"
      >
        4
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('5')}
        className="h-9 text-sm rounded-lg"
      >
        5
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('6')}
        className="h-9 text-sm rounded-lg"
      >
        6
      </Button>
      <Button
        variant="outline"
        onClick={() => onOperationClick('+')}
        className="h-9 text-xs rounded-lg"
      >
        +
      </Button>

      <Button
        variant="outline"
        onClick={() => onNumberClick('1')}
        className="h-9 text-sm rounded-lg"
      >
        1
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('2')}
        className="h-9 text-sm rounded-lg"
      >
        2
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('3')}
        className="h-9 text-sm rounded-lg"
      >
        3
      </Button>
      <Button
        onClick={onCalculate}
        className="row-span-2 bg-morandi-gold hover:bg-morandi-gold/80 text-white rounded-lg"
      >
        =
      </Button>

      <Button
        variant="outline"
        onClick={() => onNumberClick('0')}
        className="col-span-2 h-9 text-sm rounded-lg"
      >
        0
      </Button>
      <Button
        variant="outline"
        onClick={() => onNumberClick('.')}
        className="h-9 text-sm rounded-lg"
      >
        .
      </Button>
    </div>
  );
};
