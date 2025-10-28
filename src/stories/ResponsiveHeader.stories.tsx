import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

const meta = {
  title: 'Layout/ResponsiveHeader',
  component: ResponsiveHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResponsiveHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithBreadcrumb: Story = {
  args: {
    title: 'Tours Management',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Tours', href: '/tours' },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: 'Orders',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Orders', href: '/orders' },
    ],
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>
    ),
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Dashboard',
    description: 'Overview of your business metrics and recent activities',
    breadcrumb: [
      { label: 'Home', href: '/' },
    ],
  },
};
