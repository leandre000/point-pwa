import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Check, User } from 'lucide-react';
import { Button } from './Button.js';
import { IconButton } from './IconButton.js';
import { Input } from './Input.js';
import { Textarea } from './Textarea.js';
import { Badge } from './Badge.js';
import { Banner } from './Banner.js';
import { Avatar } from './Avatar.js';
import { BottomNav } from './BottomNav.js';
import { TopAppBar } from './TopAppBar.js';
import { EmptyState } from './EmptyState.js';
import { ErrorState } from './ErrorState.js';

describe('UI Foundation Components', () => {
  describe('Button', () => {
    it('renders with children and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Post Job</Button>);
      const btn = screen.getByRole('button', { name: /post job/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders loading state and disables interaction', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Saving
        </Button>,
      );
      const btn = screen.getByRole('button', { name: /saving/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('IconButton', () => {
    it('renders accessible icon button with aria-label', () => {
      render(<IconButton icon={User} aria-label="Profile settings" />);
      const btn = screen.getByRole('button', { name: /profile settings/i });
      expect(btn).toBeInTheDocument();
    });
  });

  describe('Input & Textarea', () => {
    it('renders input with label and error state', () => {
      render(
        <Input
          label="Phone number"
          error="Invalid phone format"
          placeholder="+250..."
        />,
      );
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders textarea with helper text', () => {
      render(
        <Textarea
          label="Job Description"
          helperText="Describe what needs fixing"
        />,
      );
      expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
      expect(screen.getByText(/describe what needs fixing/i)).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('always shows both an icon and a text label (never color alone)', () => {
      render(<Badge status="completed" label="Completed" />);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Completed');
      // SVG icon should be present inside badge
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    it('renders custom icon if provided', () => {
      render(<Badge status="open" label="Verified" icon={Check} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Verified');
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Banner', () => {
    it('renders offline banner with last-updated timestamp', () => {
      render(
        <Banner
          variant="offline"
          message="You are currently offline."
          lastUpdated="2 mins ago"
        />,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      expect(screen.getByText(/last updated: 2 mins ago/i)).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('generates initials correctly from full name', () => {
      render(<Avatar name="Eric Mugisha" />);
      expect(screen.getByText('EM')).toBeInTheDocument();
    });
  });

  describe('BottomNav', () => {
    it('renders 5 distinct navigation items', () => {
      const handleSelect = vi.fn();
      render(<BottomNav activeId="home" onSelect={handleSelect} />);
      expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /jobs/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /me/i })).toBeInTheDocument();
    });
  });

  describe('TopAppBar', () => {
    it('renders title and back button', () => {
      const handleBack = vi.fn();
      render(
        <TopAppBar
          title="Cleaning in Remera"
          subtitle="Open for offers"
          onBack={handleBack}
        />,
      );
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Cleaning in Remera',
      );
      expect(screen.getByText('Open for offers')).toBeInTheDocument();
      const backBtn = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders empty state with title, description, and action', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No open jobs"
          description="There are currently no open jobs in your selected area."
          action={{ label: 'Change Area', onClick: handleAction }}
        />,
      );
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('No open jobs');
      expect(
        screen.getByText(/there are currently no open jobs/i),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /change area/i }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders error state with retry button', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          description="Failed to load job details. Please check your connection."
          onRetry={handleRetry}
        />,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/failed to load job details/i),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});

