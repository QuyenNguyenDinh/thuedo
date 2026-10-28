import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Costume } from '../types';

interface CostumeCardProps {
  costume: Costume;
  searchDates?: { startDate?: string; endDate?: string };
}

export const CostumeCard: React.FC<CostumeCardProps> = ({ costume, searchDates }) => {
  const fallbackImg =
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';

  const detailUrl = searchDates?.startDate && searchDates?.endDate
    ? `/costumes/${costume.id}?startDate=${searchDates.startDate}&endDate=${searchDates.endDate}`
    : `/costumes/${costume.id}`;

  return (
    <Card className="costume-card h-100 shadow-sm border-0 d-flex flex-column">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={costume.primaryImage || fallbackImg}
          alt={costume.name}
          className="costume-card-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImg;
          }}
        />
        {costume.category && (
          <Badge
            bg="dark"
            className="position-absolute top-0 start-0 m-2 px-2 py-1 bg-opacity-75"
          >
            {costume.category.name}
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-3">
        <h6 className="fw-bold mb-1 text-truncate" title={costume.name}>
          {costume.name}
        </h6>

        {(costume.characterName || costume.seriesName) && (
          <small className="text-muted mb-2 text-truncate">
            {costume.characterName} {costume.seriesName ? `• ${costume.seriesName}` : ''}
          </small>
        )}

        <div className="mb-2">
          <small className="text-muted me-1">Kích cỡ:</small>
          {costume.availableSizes && costume.availableSizes.length > 0 ? (
            costume.availableSizes.map((size) => (
              <Badge key={size} bg="light" text="dark" className="border me-1 px-1">
                {size}
              </Badge>
            ))
          ) : (
            <Badge bg="light" text="dark" className="border">
              FreeSize
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-2 border-top">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <div>
              <span className="text-danger fw-bold fs-5">
                {costume.dailyPrice.toLocaleString('vi-VN')} ₫
              </span>
              <small className="text-muted"> / ngày</small>
            </div>
            <small className="text-secondary" style={{ fontSize: '0.78rem' }}>
              Cọc: {costume.depositAmount.toLocaleString('vi-VN')} ₫
            </small>
          </div>

          <Link
            to={detailUrl}
            className="btn btn-primary w-100 fw-semibold py-2"
          >
            Xem chi tiết & Đặt thuê <i className="bi bi-chevron-right ms-1"></i>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};
