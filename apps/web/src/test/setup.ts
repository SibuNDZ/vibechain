import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Solana wallet adapter hooks
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: false,
    publicKey: null,
    signMessage: vi.fn(),
    sendTransaction: vi.fn(),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      confirmTransaction: vi.fn(),
    },
  })),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' '),
}));
