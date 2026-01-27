import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FundButton } from './FundButton';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

vi.mock('wagmi');

describe('FundButton', () => {
  const defaultProps = {
    campaignId: '1',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
  };

  const mockWriteContract = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      writeContract: mockWriteContract,
      data: undefined,
      isPending: false,
    });
    (useWaitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isSuccess: false,
    });
  });

  it('shows connect wallet message when not connected', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: false });

    render(<FundButton {...defaultProps} />);

    expect(screen.getByText('Connect Wallet to Fund')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows fund button when connected', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} />);

    expect(screen.getByText('Fund This Project')).toBeInTheDocument();
  });

  it('opens funding form when clicking fund button', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} />);

    fireEvent.click(screen.getByText('Fund This Project'));

    expect(screen.getByPlaceholderText('Amount in MATIC')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('closes form when clicking cancel', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

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
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in MATIC') as HTMLInputElement;
    expect(input.value).toBe('0.01');
  });

  it('uses custom minimum contribution', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} minContribution={0.5} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in MATIC') as HTMLInputElement;
    expect(input.value).toBe('0.5');
  });

  it('allows changing the amount', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const input = screen.getByPlaceholderText('Amount in MATIC');
    fireEvent.change(input, { target: { value: '5' } });

    expect((input as HTMLInputElement).value).toBe('5');
  });

  it('calls writeContract when confirming', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));
    fireEvent.click(screen.getByText('Confirm'));

    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: defaultProps.contractAddress,
        functionName: 'contribute',
        args: [BigInt(1)],
      })
    );
  });

  it('shows processing state when transaction is pending', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      writeContract: mockWriteContract,
      data: '0xhash',
      isPending: true,
    });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows processing state when confirming transaction', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });
    (useWaitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: true,
      isSuccess: false,
    });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows success message when transaction succeeds', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });
    (useWaitForTransactionReceipt as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isSuccess: true,
    });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    expect(
      screen.getByText('Thank you for your contribution!')
    ).toBeInTheDocument();
  });

  it('disables confirm button while processing', () => {
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({ isConnected: true });
    (useWriteContract as ReturnType<typeof vi.fn>).mockReturnValue({
      writeContract: mockWriteContract,
      data: undefined,
      isPending: true,
    });

    render(<FundButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Fund This Project'));

    const confirmButton = screen.getByText('Processing...');
    expect(confirmButton).toBeDisabled();
  });
});
