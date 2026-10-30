import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getToday, getDayOffset } from '../utils/date';

interface SearchBarProps {
  initialKeyword?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialKeyword = '',
  initialStartDate = '',
  initialEndDate = '',
  compact = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [keyword, setKeyword] = useState<string>(
    initialKeyword || searchParams.get('keyword') || '',
  );
  const [startDate, setStartDate] = useState<string>(
    initialStartDate || searchParams.get('startDate') || getToday(),
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate || searchParams.get('endDate') || getDayOffset(2),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    // Keep existing category / size / price if on costume page
    const cat = searchParams.get('categoryId');
    if (cat) params.set('categoryId', cat);

    navigate(`/costumes?${params.toString()}`);
  };

  return (
    <Form onSubmit={handleSubmit} className="booking-search-box">
      <Row className="g-1 align-items-center">
        <Col md={5} xs={12}>
          <div className="d-flex align-items-center px-2">
            <i className="bi bi-search text-warning fs-5 me-2"></i>
            <Form.Control
              type="text"
              placeholder="Bạn tìm trang phục, nhân vật nào? (Raiden, Frieren...)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="booking-search-input"
              aria-label="Tìm kiếm trang phục"
            />
          </div>
        </Col>

        <Col md={3} xs={6}>
          <div className="d-flex align-items-center px-2">
            <i className="bi bi-calendar-event text-primary fs-5 me-2"></i>
            <div className="w-100">
              <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                Ngày nhận đồ
              </small>
              <Form.Control
                type="date"
                value={startDate}
                min={getToday()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="booking-search-input p-1"
                aria-label="Ngày nhận đồ"
              />
            </div>
          </div>
        </Col>

        <Col md={3} xs={6}>
          <div className="d-flex align-items-center px-2">
            <i className="bi bi-calendar-check text-success fs-5 me-2"></i>
            <div className="w-100">
              <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                Ngày trả đồ
              </small>
              <Form.Control
                type="date"
                value={endDate}
                min={startDate || getToday()}
                onChange={(e) => setEndDate(e.target.value)}
                className="booking-search-input p-1"
                aria-label="Ngày trả đồ"
              />
            </div>
          </div>
        </Col>

        <Col md={1} xs={12} className="text-center">
          <Button
            type="submit"
            className="btn-search-gold w-100 d-flex justify-content-center align-items-center py-2"
            title="Tìm kiếm trang phục"
            aria-label="Tìm kiếm trang phục"
          >
            <i className="bi bi-arrow-right-short fs-4"></i>
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

