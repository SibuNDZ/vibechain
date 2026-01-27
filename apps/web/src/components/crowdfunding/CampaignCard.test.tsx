import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampaignCard } from './CampaignCard';

describe('CampaignCard', () => {
  const defaultProps = {
    id: 'campaign-1',
    title: 'Test Campaign',
    artist: 'Test Artist',
    thumbnailUrl: '/test-thumb.jpg',
    goalAmount: 10000,
    raisedAmount: 5000,
    backerCount: 42,
    daysLeft: 15,
  };

  it('renders campaign title and artist', () => {
    render(<CampaignCard {...defaultProps} />);

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('displays correct funding amounts', () => {
    render(<CampaignCard {...defaultProps} />);

    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText(/of \$10,000/)).toBeInTheDocument();
  });

  it('displays backer count', () => {
    render(<CampaignCard {...defaultProps} />);

    expect(screen.getByText('42 backers')).toBeInTheDocument();
  });

  it('displays days left', () => {
    render(<CampaignCard {...defaultProps} />);

    expect(screen.getByText('15 days left')).toBeInTheDocument();
  });

  it('calculates and displays progress correctly', () => {
    render(<CampaignCard {...defaultProps} />);

    // Progress bar should exist
    const progressBar = document.querySelector(
      '[class*="bg-gradient-to-r"]'
    );
    expect(progressBar).toBeInTheDocument();

    // With 5000/10000 = 50% funded
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('caps progress at 100% when overfunded', () => {
    render(
      <CampaignCard
        {...defaultProps}
        raisedAmount={15000}
        goalAmount={10000}
      />
    );

    const progressBar = document.querySelector(
      '[class*="bg-gradient-to-r"]'
    );
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('links to campaign detail page', () => {
    render(<CampaignCard {...defaultProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/crowdfunding/campaign-1');
  });

  it('displays thumbnail image', () => {
    render(<CampaignCard {...defaultProps} />);

    const image = screen.getByAltText('Test Campaign');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-thumb.jpg');
  });

  it('formats large numbers with commas', () => {
    render(
      <CampaignCard
        {...defaultProps}
        goalAmount={1000000}
        raisedAmount={750000}
      />
    );

    expect(screen.getByText('$750,000')).toBeInTheDocument();
    expect(screen.getByText(/of \$1,000,000/)).toBeInTheDocument();
  });
});
