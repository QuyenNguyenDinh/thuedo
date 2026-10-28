import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { OrderStatus } from '../types';

describe('StatusBadge Component', () => {
  it('renders PENDING status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.PENDING} />);
    expect(screen.getByText(/Chờ xác nhận/i)).toBeInTheDocument();
  });

  it('renders CONFIRMED status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.CONFIRMED} />);
    expect(screen.getByText(/Đã xác nhận/i)).toBeInTheDocument();
  });

  it('renders RENTING status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.RENTING} />);
    expect(screen.getByText(/Đang thuê đồ/i)).toBeInTheDocument();
  });

  it('renders RETURNED status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.RETURNED} />);
    expect(screen.getByText(/Đã hoàn tất trả đồ/i)).toBeInTheDocument();
  });

  it('renders CANCELLED status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.CANCELLED} />);
    expect(screen.getByText(/Khách đã hủy/i)).toBeInTheDocument();
  });

  it('renders REJECTED status with correct Vietnamese label', () => {
    render(<StatusBadge status={OrderStatus.REJECTED} />);
    expect(screen.getByText(/Cửa hàng từ chối/i)).toBeInTheDocument();
  });
});

