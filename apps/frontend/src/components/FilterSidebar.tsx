import React from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';
import { Category } from '../types';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedSize,
  onSelectSize,
  minPrice,
  maxPrice,
  onPriceChange,
  onReset,
}) => {
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];

  return (
    <Card className="filter-card shadow-sm border-0 mb-4">
      <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
        <h6 className="mb-0 fw-bold">
          <i className="bi bi-funnel-fill text-warning me-2"></i>Bộ lọc tìm kiếm
        </h6>
        <Button variant="link" size="sm" className="p-0 text-decoration-none text-muted" onClick={onReset}>
          Đặt lại
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <h6 className="fw-semibold small text-uppercase text-muted mb-2">Danh mục trang phục</h6>
        <div className="form-check mb-1">
          <input
            className="form-check-input"
            type="radio"
            name="categoryRadio"
            id="cat-all"
            checked={!selectedCategory}
            onChange={() => onSelectCategory('')}
          />
          <label className="form-check-label small" htmlFor="cat-all">
            Tất cả danh mục
          </label>
        </div>
        {categories.map((cat) => (
          <div className="form-check mb-1 d-flex justify-content-between" key={cat.id}>
            <div>
              <input
                className="form-check-input"
                type="radio"
                name="categoryRadio"
                id={`cat-${cat.id}`}
                checked={selectedCategory === cat.id}
                onChange={() => onSelectCategory(cat.id)}
              />
              <label className="form-check-label small" htmlFor={`cat-${cat.id}`}>
                {cat.name}
              </label>
            </div>
            {cat.costumeCount !== undefined && (
              <span className="badge text-muted small">{cat.costumeCount}</span>
            )}
          </div>
        ))}
      </div>

      {/* Size Filter */}
      <div className="mb-4">
        <h6 className="fw-semibold small text-uppercase text-muted mb-2">Kích cỡ sẵn có</h6>
        <div className="d-flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={!selectedSize ? 'primary' : 'outline-secondary'}
            className="py-1 px-2 small"
            onClick={() => onSelectSize('')}
          >
            Tất cả
          </Button>
          {sizes.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={selectedSize === s ? 'primary' : 'outline-secondary'}
              className="py-1 px-2 small"
              onClick={() => onSelectSize(selectedSize === s ? '' : s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-3">
        <h6 className="fw-semibold small text-uppercase text-muted mb-2">Giá thuê / ngày (VNĐ)</h6>
        <div className="d-flex align-items-center gap-2 mb-2">
          <Form.Control
            type="number"
            size="sm"
            placeholder="Từ (đ)"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
          />
          <span className="text-muted">-</span>
          <Form.Control
            type="number"
            size="sm"
            placeholder="Đến (đ)"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
          />
        </div>
        <div className="d-flex flex-column gap-1">
          <Button
            variant="light"
            size="sm"
            className="text-start py-1 px-2 text-muted small"
            onClick={() => onPriceChange('0', '150000')}
          >
            Dưới 150.000 ₫
          </Button>
          <Button
            variant="light"
            size="sm"
            className="text-start py-1 px-2 text-muted small"
            onClick={() => onPriceChange('150000', '250000')}
          >
            150.000 ₫ – 250.000 ₫
          </Button>
          <Button
            variant="light"
            size="sm"
            className="text-start py-1 px-2 text-muted small"
            onClick={() => onPriceChange('250000', '')}
          >
            Trên 250.000 ₫
          </Button>
        </div>
      </div>
    </Card>
  );
};

