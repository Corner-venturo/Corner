'use client'

import { useForm, UseFormProps, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ZodObjectSchema = z.ZodObject<z.ZodRawShape>

/**
 * 預設的表單選項
 */
const defaultFormOptions = {
  mode: 'onBlur' as const,
  reValidateMode: 'onChange' as const,
}

/**
 * 建立帶有 Zod 驗證的表單 Hook
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(1, '請輸入名稱'),
 *   email: z.string().email('請輸入有效的 Email'),
 * })
 *
 * function MyForm() {
 *   const form = useZodForm({
 *     schema,
 *     defaultValues: { name: '', email: '' },
 *   })
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('name')} />
 *       {form.formState.errors.name && <span>{form.formState.errors.name.message}</span>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useZodForm<TSchema extends ZodObjectSchema>(
  props: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> & {
    schema: TSchema
  }
) {
  const { schema, ...formProps } = props

  return useForm<z.infer<TSchema>>({
    ...defaultFormOptions,
    ...formProps,
    resolver: zodResolver(schema),
  } as UseFormProps<z.infer<TSchema>>)
}

/**
 * 常用的 Zod schema 工具
 */
export const schemas = {
  /** 必填字串 */
  requiredString: (message = '此欄位必填') => z.string().min(1, message),

  /** Email */
  email: (message = '請輸入有效的 Email') => z.string().email(message),

  /** 電話 (台灣格式) */
  phone: (message = '請輸入有效的電話號碼') =>
    z.string().regex(/^(0[2-9]\d{7,8}|09\d{8})$/, message),

  /** 手機 (台灣格式) */
  mobile: (message = '請輸入有效的手機號碼') =>
    z.string().regex(/^09\d{8}$/, message),

  /** 身分證字號 */
  nationalId: (message = '請輸入有效的身分證字號') =>
    z.string().regex(/^[A-Z][12]\d{8}$/, message),

  /** 護照號碼 */
  passportNumber: (message = '請輸入有效的護照號碼') =>
    z.string().regex(/^[A-Z0-9]{6,9}$/, message),

  /** 日期 (YYYY-MM-DD) */
  dateString: (message = '請輸入有效的日期') =>
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message),

  /** 正數 */
  positiveNumber: (message = '請輸入正數') =>
    z.number().positive(message),

  /** 非負數 */
  nonNegativeNumber: (message = '請輸入非負數') =>
    z.number().nonnegative(message),

  /** 金額 (最多兩位小數) */
  amount: (message = '請輸入有效的金額') =>
    z.number().nonnegative(message).multipleOf(0.01),
}

/**
 * 表單錯誤訊息的中文對應
 * @description 自訂 Zod 錯誤訊息
 */
export function getChineseErrorMessage(issue: z.ZodIssue): string {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') return '請輸入文字'
      if (issue.expected === 'number') return '請輸入數字'
      break
    case z.ZodIssueCode.too_small:
      return `至少需要 ${issue.minimum} 個字元或數值`
    case z.ZodIssueCode.too_big:
      return `最多 ${issue.maximum} 個字元或數值`
  }
  return issue.message || '驗證失敗'
}

export { z }
