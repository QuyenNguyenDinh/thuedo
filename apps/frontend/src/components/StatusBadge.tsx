import React from 'react';
import { Badge } from 'react-bootstrap';
import { OrderStatus } from '../types';
import { getToday } from '../utils/date';

interface StatusBadgeProps {
  status: OrderStatus;
  /** Ngày trả dự kiến (YYYY-MM-DD); truyền vào để cảnh báo đơn đang thuê đã quá hạn. */
  endDate?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, endDate }) => {
  if (status === OrderStatus.RENTING && endDate && endDate < getToday()) {
    return (
      <Badge bg="danger" className="px-2 py-1">
        <i className="bi bi-exclamation-triangle-fill me-1"></i> Quá hạn trả đồ
      </Badge>
    );
  }

  switch (status) {
    case OrderStatus.PENDING:
      return (
        <Badge bg="warning" text="dark" className="px-2 py-1">
          <i className="bi bi-clock-history me-1"></i> Chờ xác nhận
        </Badge>
      );
    case OrderStatus.CONFIRMED:
      return (
        <Badge bg="info" text="dark" className="px-2 py-1">
          <i className="bi bi-check2-circle me-1"></i> Đã xác nhận
        </Badge>
      );
    case OrderStatus.RENTING:
      return (
        <Badge bg="primary" className="px-2 py-1">
          <i className="bi bi-person-walking me-1"></i> Đang thuê đồ
        </Badge>
      );
    case OrderStatus.RETURNED:
      return (
        <Badge bg="success" className="px-2 py-1">
          <i className="bi bi-check-all me-1"></i> Đã hoàn tất trả đồ
        </Badge>
      );
    case OrderStatus.CANCELLED:
      return (
        <Badge bg="secondary" className="px-2 py-1">
          <i className="bi bi-x-circle me-1"></i> Khách đã hủy
        </Badge>
      );
    case OrderStatus.REJECTED:
      return (
        <Badge bg="danger" className="px-2 py-1">
          <i className="bi bi-slash-circle me-1"></i> Cửa hàng từ chối
        </Badge>
      );
    default:
      return <Badge bg="secondary">{status}</Badge>;
  }
};

