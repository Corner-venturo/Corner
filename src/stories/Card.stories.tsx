import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/card';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-sm text-gray-600">
          This is a card component with some content inside.
        </p>
      </div>
    ),
  },
};

export const WithImage: Story = {
  args: {
    children: (
      <div>
        <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-lg" />
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Beautiful Card</h3>
          <p className="text-sm text-gray-600">
            Card with a gradient background image.
          </p>
        </div>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    className: 'hover:shadow-lg transition-shadow cursor-pointer',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
        <p className="text-sm text-gray-600">
          Hover over this card to see the effect!
        </p>
      </div>
    ),
  },
};
