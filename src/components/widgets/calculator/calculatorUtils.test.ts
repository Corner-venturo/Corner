import { describe, it, expect } from 'vitest'
import { calculate, evaluateExpression, processPastedText, isOperator } from './calculatorUtils'

describe('calculate', () => {
  it('adds two numbers', () => {
    expect(calculate(2, 3, '+')).toBe(5)
  })
  it('subtracts two numbers', () => {
    expect(calculate(5, 3, '-')).toBe(2)
  })
  it('multiplies two numbers', () => {
    expect(calculate(4, 3, '×')).toBe(12)
  })
  it('divides two numbers', () => {
    expect(calculate(10, 2, '÷')).toBe(5)
  })
  it('returns secondValue for unknown operator', () => {
    expect(calculate(10, 5, '%')).toBe(5)
  })
  it('handles negative numbers', () => {
    expect(calculate(-3, 4, '+')).toBe(1)
  })
  it('handles decimal numbers', () => {
    expect(calculate(1.5, 2.5, '+')).toBe(4)
  })
  it('divides by zero returns Infinity', () => {
    expect(calculate(5, 0, '÷')).toBe(Infinity)
  })
  it('multiplies by zero', () => {
    expect(calculate(999, 0, '×')).toBe(0)
  })
  it('subtracts to negative', () => {
    expect(calculate(3, 5, '-')).toBe(-2)
  })
})

describe('evaluateExpression', () => {
  it('evaluates simple addition', () => {
    expect(evaluateExpression('2+3')).toBe(5)
  })
  it('evaluates multiplication', () => {
    expect(evaluateExpression('3*4')).toBe(12)
  })
  it('evaluates division', () => {
    expect(evaluateExpression('10/2')).toBe(5)
  })
  it('respects operator precedence', () => {
    expect(evaluateExpression('2+3*4')).toBe(14)
  })
  it('handles parentheses', () => {
    expect(evaluateExpression('(2+3)*4')).toBe(20)
  })
  it('handles × and ÷ symbols', () => {
    expect(evaluateExpression('3×4')).toBe(12)
    expect(evaluateExpression('12÷3')).toBe(4)
  })
  it('returns fallback for empty string', () => {
    expect(evaluateExpression('', 42)).toBe(0)
  })
  it('returns fallback for invalid expression', () => {
    expect(evaluateExpression('abc', 0)).toBe(0)
  })
  it('handles negative numbers', () => {
    expect(evaluateExpression('-5+3')).toBe(-2)
  })
  it('handles nested parentheses', () => {
    expect(evaluateExpression('((2+3))*2')).toBe(10)
  })
})

describe('processPastedText', () => {
  it('converts fullwidth digits', () => {
    expect(processPastedText('１２３')).toBe('123')
  })
  it('converts fullwidth operators', () => {
    expect(processPastedText('＋')).toBe('+')
    expect(processPastedText('－')).toBe('-')
    expect(processPastedText('＊')).toBe('×')
    expect(processPastedText('／')).toBe('÷')
  })
  it('converts fullwidth decimal and equals', () => {
    expect(processPastedText('３．１４')).toBe('3.14')
    expect(processPastedText('＝')).toBe('=')
  })
  it('removes letters', () => {
    expect(processPastedText('12abc34')).toBe('1234')
  })
  it('converts * to × and / to ÷', () => {
    expect(processPastedText('3*4')).toBe('3×4')
    expect(processPastedText('12/3')).toBe('12÷3')
  })
  it('handles mixed input', () => {
    expect(processPastedText('１２＋３４')).toBe('12+34')
  })
})

describe('isOperator', () => {
  it('recognizes +', () => expect(isOperator('+')).toBe(true))
  it('recognizes -', () => expect(isOperator('-')).toBe(true))
  it('recognizes ×', () => expect(isOperator('×')).toBe(true))
  it('recognizes ÷', () => expect(isOperator('÷')).toBe(true))
  it('rejects numbers', () => expect(isOperator('5')).toBe(false))
  it('rejects letters', () => expect(isOperator('a')).toBe(false))
  it('rejects *', () => expect(isOperator('*')).toBe(false))
})
