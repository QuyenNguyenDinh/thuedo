import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CostumeCard } from './CostumeCard';
import { Costume } from '../types';

describe('CostumeCard Component', () => {
  const mockCostume: Costume = {
    id: 'cos-123',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Game Cosplay',
      slug: 'game-cosplay',
      displayOrder: 1,
      isActive: true,
    },
    name: 'Raiden Shogun - Genshin Impact',
    slug: 'raiden-shogun',
    characterName: 'Raiden Shogun',
    seriesName: 'Genshin Impact',
    description: 'Trang phục lụa gấm...',
    dailyPrice: 200000,
    depositAmount: 600000,
    isActive: true,
    primaryImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    availableSizes: ['S', 'M', 'L'],
  };

  it('renders costume title, daily price in VND, and category badge', () => {
    render(
      <BrowserRouter>
        <CostumeCard costume={mockCostume} />
      </BrowserRouter>,
    );

    expect(screen.getByText('Raiden Shogun - Genshin Impact')).toBeInTheDocument();
    expect(screen.getByText('Game Cosplay')).toBeInTheDocument();
    // VND formatted: 200.000 ₫
    expect(screen.getByText(/200\.000/)).toBeInTheDocument();
    // Deposit formatted: 600.000 ₫
    expect(screen.getByText(/600\.000/)).toBeInTheDocument();
  });

  it('renders all available size badges', () => {
    render(
      <BrowserRouter>
        <CostumeCard costume={mockCostume} />
      </BrowserRouter>,
    );

    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('renders link to costume detail page', () => {
    render(
      <BrowserRouter>
        <CostumeCard costume={mockCostume} />
      </BrowserRouter>,
    );

    const buttonLink = screen.getByRole('link', { name: /Xem chi tiết & Đặt thuê/i });
    expect(buttonLink).toHaveAttribute('href', '/costumes/cos-123');
  });
});
