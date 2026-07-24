import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FundButton } from './FundButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

vi.mock('@solana/wallet-adapter-react');

describe('FundButton', () => {
  const defaultProps = {
    campaignId: '1',
    programAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
  };

  const mockSendTransaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useConnection as ReturnType<typeof vi.fn>).mockReturnValue({
      connection: {
        confirmTransaction: vi.fn().mockResolvedValue({}),
      },
    });
    (useWallet as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: true,
      publicKey: { toBase58: () => 'TestPublicKey11111111111111111111111111111' },
      sendTransaction: mockSendTransaction,
    });
  });

  it('shows connect wallet message when not connected', () => {
    (useWallet as ReturnType<typeof vi.fn>).mockReturnValue({
      connected: false,
      publicKey: null,
      sendTransaction: mockSendTransaction,
    });

    render(<FundButton {...defaultProps} />);

    expect(screen.getByText('Connect Wallet to Fund')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows fund button when connected', () => {
    render(<FundButton {...defaultProps} />);

    expect(screen.getByText('Fund This Project')).toBeInTheDocument();
  });

  it('opens funding form when clicking fund button', () => {
    render(<FundButton {...defaultProps} />);

    fireEvent.click(screen.getByText('Fund This Project'));

    expect(screen.getByPlaceholderText('Amount in SOL')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('closes form when clicking cancel', () => {
    render(<FundButton {...defaultProps} />);

    // Open form
    fireEvent.click(screen.getByText('Fund This Project'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Close form
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.getByText('Fund This Project')).toBeInTheDocument();
  });

  it('uses default minimum contribution', () => {
    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in SOL') as HTMLInputElement;
    expect(input.value).toBe('0.01');
  });

  it('uses custom minimum contribution', () => {
    render(<FundButton {...defaultProps} minContribution={0.5} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in SOL') as HTMLInputElement;
    expect(input.value).toBe('0.5');
  });

  it('allows changing the amount', () => {
    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in SOL');
    fireEvent.change(input, { target: { value: '5' } });

    expect((input as HTMLInputElement).value).toBe('5');
  });
});
