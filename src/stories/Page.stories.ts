// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/nextjs'

let expect: any
let userEvent: any
let within: any

try {
  const testUtils = require('storybook/test')
  expect = testUtils.expect as any
  userEvent = testUtils.userEvent as any
  within = testUtils.within as any
} catch {
  // Storybook modules not available
}

import { Page } from './Page'

const meta = {
  title: 'Example/Page',
  component: Page,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Page>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {}

// More on component testing: https://storybook.js.org/docs/writing-tests/interaction-testing
export const LoggedIn: Story = {
  play: async ({ canvasElement }: any) => {
    if (!within || !expect || !userEvent) return

    const canvas = within(canvasElement as HTMLElement)
    const loginButton = canvas.getByRole('button', { name: /Log in/i })
    await expect(loginButton).toBeInTheDocument()
    await userEvent.click(loginButton)
    await expect(loginButton).not.toBeInTheDocument()

    const logoutButton = canvas.getByRole('button', { name: /Log out/i })
    await expect(logoutButton).toBeInTheDocument()
  },
}
