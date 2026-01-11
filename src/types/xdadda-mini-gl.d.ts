declare module '@xdadda/mini-gl' {
  interface AdjustmentsOptions {
    brightness?: number
    contrast?: number
    exposure?: number
    gamma?: number
    shadows?: number
    highlights?: number
    temperature?: number
    tint?: number
    vibrance?: number
    saturation?: number
    sepia?: number
  }

  interface VignetteOptions {
    size?: number
    amount?: number
  }

  interface CropOptions {
    left: number
    top: number
    width: number
    height: number
  }

  interface ResizeOptions {
    width: number
    height: number
  }

  interface MiniGLInstance {
    loadimage(): void
    filterAdjustments(options: AdjustmentsOptions): void
    filterVignette(options: VignetteOptions): void
    filterBlur(options: { radius: number }): void
    filterSharpen(options: { amount: number }): void
    filterNoise(options: { amount: number }): void
    paintCanvas(): void
    captureImage(format?: string, quality?: number): string
    crop(options: CropOptions): void
    resize(options: ResizeOptions): void
    destroy(): void
  }

  type ColorSpace = 'srgb' | 'display-p3'

  function minigl(
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    colorspace?: ColorSpace
  ): MiniGLInstance

  export default minigl
}
