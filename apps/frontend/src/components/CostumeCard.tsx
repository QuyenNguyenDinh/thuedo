import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Costume } from '../types';
import { RatingBadge, getPseudoRating } from './RatingBadge';
import { isInWishlist, toggleWishlist } from '../services/wishlist';

interface CostumeCardProps {
  costume: Costume;
  searchDates?: { startDate?: string; endDate?: string };
}

export const CostumeCard: React.FC<CostumeCardProps> = ({ costume, searchDates }) => {
  const [saved, setSaved] = useState<boolean>(() => isInWishlist(costume.id));

  useEffect(() => {
    const handleWishlistChange = () => {
      setSaved(isInWishlist(costume.id));
    };
    window.addEventListener('cosrent_wishlist_change', handleWishlistChange);
    return () => {
      window.removeEventListener('cosrent_wishlist_change', handleWishlistChange);
    };
  }, [costume.id]);

  const fallbackImg =
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';

  const detailUrl = searchDates?.startDate && searchDates?.endDate
    ? `/costumes/${costume.id}?startDate=${searchDates.startDate}&endDate=${searchDates.endDate}`
    : `/costumes/${costume.id}`;

  const rating = getPseudoRating(costume.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleWishlist(costume.id);
    setSaved(newState);
  };

  return (
    <Card className="costume-card h-100 shadow-sm border-0 d-flex flex-column">
      <div className="costume-card-img-wrapper">
        <Card.Img
          variant="top"
          src={costume.primaryImage || fallbackImg}
          alt={costume.name}
          className="costume-card-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImg;
          }}
        />

        {/* Category Badge */}
        {costume.category && (
          <span className="card-category-badge">
            {costume.category.name}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          className={`btn-wishlist ${saved ? 'active' : ''}`}
          onClick={handleHeartClick}
          aria-label={saved ? 'Bỏ lưu trang phục' : 'Lưu vào danh sách yêu thích'}
          title={saved ? 'Bỏ lưu' : 'Lưu trang phục này'}
        >
          <i className={`bi ${saved ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
      </div>

      <Card.Body className="d-flex flex-column p-3">
        {/* Rating Score Booking style */}
        <div className="mb-2">
          <RatingBadge
            score={rating.score}
            reviewCount={rating.reviewCount}
            label={rating.label}
            size="sm"
          />
        </div>

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

        {/* Guarantee micro tag */}
        <div className="mb-2">
          <small className="text-success" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            <i className="bi bi-shield-check me-1"></i>Đã giặt hấp & thử tại quầy
          </small>
        </div>

        <div className="mt-auto pt-2 border-top">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <div>
              <span className="fw-bold fs-5 text-dark">
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
