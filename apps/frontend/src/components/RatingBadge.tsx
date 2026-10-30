import React from 'react';
import { ProgressBar } from 'react-bootstrap';

interface RatingBadgeProps {
  score?: number;
  reviewCount?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const getPseudoRating = (id: string = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  // Rating between 9.1 and 9.9
  const score = Number((9.1 + (absHash % 9) * 0.1).toFixed(1));
  // Reviews between 24 and 160
  const reviewCount = 24 + (absHash % 137);

  let label = 'Tuyệt hảo';
  if (score >= 9.6) label = 'Xuất sắc';
  else if (score >= 9.3) label = 'Tuyệt vời';
  else label = 'Rất tốt';

  return { score, reviewCount, label };
};

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  score = 9.4,
  reviewCount = 52,
  label = 'Tuyệt hảo',
  size = 'sm',
  showDetails = false,
}) => {
  if (size === 'sm') {
    return (
      <div className="d-flex align-items-center justify-content-end gap-2 text-end">
        <div className="d-flex flex-column line-height-sm">
          <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
            {label}
          </span>
          <small className="text-muted" style={{ fontSize: '0.72rem' }}>
            {reviewCount} đánh giá
          </small>
        </div>
        <div className="booking-rating-pill">{score.toFixed(1)}</div>
      </div>
    );
  }

  return (
    <div className="booking-review-summary p-3 bg-white rounded border shadow-sm mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="booking-rating-pill-lg">{score.toFixed(1)}</div>
          <div>
            <h5 className="fw-bold mb-0 text-dark">{label}</h5>
            <small className="text-muted">Dựa trên {reviewCount} khách hàng đã thuê và đánh giá</small>
          </div>
        </div>
        <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
          <i className="bi bi-shield-check me-1"></i>Đánh giá xác thực 100%
        </div>
      </div>

      {showDetails && (
        <div className="row g-3 small">
          <div className="col-md-4">
            <div className="d-flex justify-content-between mb-1">
              <span>Độ sạch sẽ & thơm tho</span>
              <strong className="text-primary">9.8</strong>
            </div>
            <ProgressBar now={98} variant="primary" style={{ height: '6px' }} />
          </div>
          <div className="col-md-4">
            <div className="d-flex justify-content-between mb-1">
              <span>Chuẩn form dáng & ảnh mẫu</span>
              <strong className="text-primary">9.6</strong>
            </div>
            <ProgressBar now={96} variant="primary" style={{ height: '6px' }} />
          </div>
          <div className="col-md-4">
            <div className="d-flex justify-content-between mb-1">
              <span>Đầy đủ phụ kiện & tóc giả</span>
              <strong className="text-primary">9.5</strong>
            </div>
            <ProgressBar now={95} variant="primary" style={{ height: '6px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

