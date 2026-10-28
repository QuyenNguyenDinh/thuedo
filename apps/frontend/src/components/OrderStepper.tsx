import React from 'react';
import { OrderStatus } from '../types';

interface OrderStepperProps {
  status: OrderStatus;
}

export const OrderStepper: React.FC<OrderStepperProps> = ({ status }) => {
  const steps = [
    { key: OrderStatus.PENDING, label: 'Đã đặt đơn' },
    { key: OrderStatus.CONFIRMED, label: 'Đã xác nhận' },
    { key: OrderStatus.RENTING, label: 'Đang thuê' },
    { key: OrderStatus.RETURNED, label: 'Đã hoàn tất' },
  ];

  if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) {
    return (
      <div className="alert alert-secondary text-center py-2 mb-4">
        <i className="bi bi-info-circle me-2"></i>
        Đơn hàng này đã kết thúc với trạng thái: <strong>{status}</strong>.
      </div>
    );
  }

  const getStepIndex = (st: OrderStatus) => {
    switch (st) {
      case OrderStatus.PENDING:
        return 0;
      case OrderStatus.CONFIRMED:
        return 1;
      case OrderStatus.RENTING:
        return 2;
      case OrderStatus.RETURNED:
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="d-flex justify-content-between align-items-center py-3 px-2 mb-4 bg-white rounded border shadow-sm">
      {steps.map((step, idx) => {
        let circleClass = 'stepper-inactive';
        let icon = <span>{idx + 1}</span>;

        if (idx < currentIndex) {
          circleClass = 'stepper-completed';
          icon = <i className="bi bi-check-lg"></i>;
        } else if (idx === currentIndex) {
          circleClass = 'stepper-active';
          icon = <span>{idx + 1}</span>;
        }

        return (
          <React.Fragment key={step.key}>
            <div className="d-flex flex-column align-items-center text-center">
              <div className={`stepper-circle ${circleClass}`}>{icon}</div>
              <small
                className={`mt-1 ${
                  idx === currentIndex ? 'fw-bold text-primary' : 'text-muted'
                }`}
                style={{ fontSize: '0.8rem' }}
              >
                {step.label}
              </small>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-grow-1 mx-2"
                style={{
                  height: '3px',
                  backgroundColor: idx < currentIndex ? '#198754' : '#e9ecef',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

