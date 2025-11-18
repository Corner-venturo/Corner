import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Header } from './Header'

type HeaderArgs = {
  user?: { name: string }
  onLogin: () => void
  onLogout: () => void
  onCreateAccount: () => void
}

const meta = {
  title: 'Example/Header',
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    // @ts-ignore - Storybook fn() type compatibility
    onLogin: fn(),
    // @ts-ignore - Storybook fn() type compatibility
    onLogout: fn(),
    // @ts-ignore - Storybook fn() type compatibility
    onCreateAccount: fn(),
  },
// @ts-ignore - Meta type compatibility
} satisfies Meta<HeaderArgs>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedIn: Story = {
  args: {
    user: {
      name: 'Jane Doe',
    },
  },
}

export const LoggedOut: Story = {}
