import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoteButton } from './VoteButton';
import { useAccount } from 'wagmi';

vi.mock('wagmi');

describe('VoteButton', () => {
  const mockOnVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnVote.mockResolvedValue(undefined);
  });

  it('renders with initial vote count', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(
      <VoteButton videoId="video1" initialVotes={42} onVote={mockOnVote} />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Vote')).toBeInTheDocument();
  });

  it('disables button when not connected', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: false });

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows "Voted" state when hasVoted is true', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(
      <VoteButton
        videoId="video1"
        initialVotes={10}
        hasVoted={true}
        onVote={mockOnVote}
      />
    );

    expect(screen.getByText('Voted')).toBeInTheDocument();
  });

  it('calls onVote and updates count on click', async () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith('video1');
    });

    await waitFor(() => {
      expect(screen.getByText('11')).toBeInTheDocument();
    });
  });

  it('shows "Voted" after successful vote', async () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Voted')).toBeInTheDocument();
    });
  });

  it('handles vote failure gracefully', async () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });
    mockOnVote.mockRejectedValue(new Error('Vote failed'));

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      // Count should remain unchanged after failure
      expect(screen.getByText('10')).toBeInTheDocument();
      // Should still show "Vote" (not "Voted")
      expect(screen.getByText('Vote')).toBeInTheDocument();
    });
  });

  it('prevents multiple clicks while loading', async () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    // Make the vote take some time
    mockOnVote.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    const button = screen.getByRole('button');

    // Click multiple times
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      // Should only be called once
      expect(mockOnVote).toHaveBeenCalledTimes(1);
    });
  });

  it('disables button after voting', async () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(
      <VoteButton videoId="video1" initialVotes={10} onVote={mockOnVote} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
