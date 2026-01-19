/**
 * react-gradient-color-picker 類型聲明
 */
declare module 'react-gradient-color-picker' {
  import { FC } from 'react'

  interface ColorPickerProps {
    value: string
    onChange: (value: string) => void
    hideControls?: boolean
    hideInputs?: boolean
    hidePresets?: boolean
    hideColorGuide?: boolean
    hideAdvancedSliders?: boolean
    height?: number
    width?: number
  }

  export const ColorPicker: FC<ColorPickerProps>

  export function useColorPicker(
    value: string,
    onChange: (value: string) => void
  ): {
    setGradient: (value: string) => void
    setSolid: (value: string) => void
    value: string
    gradientType: string
  }

  export default ColorPicker
}
