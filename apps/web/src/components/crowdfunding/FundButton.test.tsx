import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FundButton } from './FundButton';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { api } from '@/lib/api';

vi.mock('@vibechain/shared', () => ({
  PROGRAM_IDS: {
    'mainnet-beta': { CROWDFUNDING: '', VOTING: '' },
    devnet: {
      CROWDFUNDING: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
      VOTING: 'HmbTLCmaGtYhSJaoxkmD54y4QhhGERbCGMKhbV2V3uEp',
    },
  },
  SOLANA_CLUSTERS: { MAINNET: 'mainnet-beta', DEVNET: 'devnet' },
}));
vi.mock('@solana/wallet-adapter-react');
vi.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <button type="button">Select Wallet</button>,
}));
vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
  ApiError: class ApiError extends Error {
    statusCode = 400;
  },
}));
vi.mock('@solana/web3.js', () => ({
  LAMPORTS_PER_SOL: 1_000_000_000,
  SystemProgram: {
    transfer: vi.fn(() => ({ keys: [] })),
  },
  Transaction: class {
    add() {
      return this;
    }
  },
  PublicKey: class {
    constructor(value: string) {
      if (!value) {
        throw new Error('Invalid public key');
      }
    }
  },
}));
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('FundButton', () => {
  const defaultProps = {
    campaignId: '1',
    programAddress: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
  };

  const mockSendTransaction = vi.fn();
  const mockConfirmTransaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('vibechain_token', 'test-token');
    mockSendTransaction.mockResolvedValue('sig111');
    mockConfirmTransaction.mockResolvedValue({});
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (useConnection as ReturnType<typeof vi.fn>).mockReturnValue({
      connection: {
        confirmTransaction: mockConfirmTransaction,
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
    expect(screen.getByText('Select Wallet')).toBeInTheDocument();
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

    fireEvent.click(screen.getByText('Fund This Project'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();

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

  it('records the contribution after a confirmed transfer', async () => {
    const onFunded = vi.fn();
    render(<FundButton {...defaultProps} onFunded={onFunded} />);

    fireEvent.click(screen.getByText('Fund This Project'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/crowdfunding/campaigns/1/contribute', {
        amount: 0.01,
        txSignature: 'sig111',
      });
    });
    expect(onFunded).toHaveBeenCalled();
  });
});
