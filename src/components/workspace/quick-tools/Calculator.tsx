import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCalculator } from './useCalculator'

export function Calculator() {
  const { display, inputNumber, inputOperation, performCalculation, clear } = useCalculator()

  return (
    <div className="max-w-sm mx-auto">
      <Card className="p-4">
        <div className="mb-4">
          <div className="bg-morandi-container/10 p-4 rounded-lg text-right text-2xl font-mono">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={clear} className="col-span-2">
            C
          </Button>
          <Button variant="outline" onClick={() => inputOperation('÷')}>
            ÷
          </Button>
          <Button variant="outline" onClick={() => inputOperation('×')}>
            ×
          </Button>

          <Button variant="outline" onClick={() => inputNumber('7')}>
            7
          </Button>
          <Button variant="outline" onClick={() => inputNumber('8')}>
            8
          </Button>
          <Button variant="outline" onClick={() => inputNumber('9')}>
            9
          </Button>
          <Button variant="outline" onClick={() => inputOperation('-')}>
            -
          </Button>

          <Button variant="outline" onClick={() => inputNumber('4')}>
            4
          </Button>
          <Button variant="outline" onClick={() => inputNumber('5')}>
            5
          </Button>
          <Button variant="outline" onClick={() => inputNumber('6')}>
            6
          </Button>
          <Button variant="outline" onClick={() => inputOperation('+')} className="row-span-2">
            +
          </Button>

          <Button variant="outline" onClick={() => inputNumber('1')}>
            1
          </Button>
          <Button variant="outline" onClick={() => inputNumber('2')}>
            2
          </Button>
          <Button variant="outline" onClick={() => inputNumber('3')}>
            3
          </Button>

          <Button variant="outline" onClick={() => inputNumber('0')} className="col-span-2">
            0
          </Button>
          <Button variant="outline" onClick={() => inputNumber('.')}>
            .
          </Button>
          <Button
            onClick={performCalculation}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            =
          </Button>
        </div>
      </Card>
    </div>
  )
}
