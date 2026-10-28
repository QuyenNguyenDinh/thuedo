import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  Carousel,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, CostumeVariant, AvailabilityResult, CalculatedQuote } from '../types';
import { useAuth } from '../context/AuthContext';

export const CostumeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [costume, setCostume] = useState<Costume | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking selections
  const [selectedVariant, setSelectedVariant] = useState<CostumeVariant | null>(null);

  const getToday = () => new Date().toISOString().split('T')[0];
  const getDayOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(
    searchParams.get('startDate') || getToday(),
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get('endDate') || getDayOffset(2),
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Availability & Quote
  const [checkingAvail, setCheckingAvail] = useState<boolean>(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [quote, setQuote] = useState<CalculatedQuote | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);

  const fallbackImg =
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';

  // 1. Fetch Costume Detail
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await api.get(`/costumes/${id}`);
        const data = res.data || res;
        setCostume(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải chi tiết trang phục.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  // 2. Check Availability whenever variant or dates change
  useEffect(() => {
    if (!id || !selectedVariant || !startDate || !endDate) return;

    if (endDate < startDate) {
      setAvailError('Ngày trả đồ không được trước ngày nhận đồ.');
      setAvailability(null);
      setQuote(null);
      return;
    }

    setCheckingAvail(true);
    setAvailError(null);

    const check = async () => {
      try {
        const [availRes, quoteRes]: any = await Promise.all([
          api.get(
            `/costumes/${id}/availability?variantId=${selectedVariant.id}&startDate=${startDate}&endDate=${endDate}`,
          ),
          api.post('/rental-quotes', {
            startDate,
            endDate,
            items: [{ costumeVariantId: selectedVariant.id, quantity }],
          }),
        ]);

        setAvailability(availRes.data || availRes);
        setQuote(quoteRes.data || quoteRes);
      } catch (err: any) {
        setAvailError(err.response?.data?.message || 'Lỗi khi kiểm tra lịch còn hàng.');
        setAvailability(null);
        setQuote(null);
      } finally {
        setCheckingAvail(false);
      }
    };

    check();
  }, [id, selectedVariant, startDate, endDate, quantity]);

  const handleProceedToCheckout = () => {
    if (!selectedVariant || !availability || !availability.isAvailable) return;

    // Navigate to checkout with query params
    const params = new URLSearchParams({
      variantId: selectedVariant.id,
      costumeId: costume!.id,
      startDate,
      endDate,
      quantity: String(quantity),
    });

    if (!user) {
      // Redirect to login first with return url
      navigate(`/login?redirect=${encodeURIComponent(`/checkout?${params.toString()}`)}`);
    } else {
      navigate(`/checkout?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Đang tải thông tin trang phục...</p>
      </Container>
    );
  }

  if (error || !costume) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Không tìm thấy trang phục.'}</Alert>
        <Link to="/costumes" className="btn btn-outline-primary">
          &larr; Quay lại danh sách trang phục
        </Link>
      </Container>
    );
  }

  return (
    <div className="py-4">
      <Container>
        {/* Breadcrumb navigation */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <Link to="/">Trang chủ</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/costumes">Trang phục</Link>
            </li>
            {costume.category && (
              <li className="breadcrumb-item">
                <Link to={`/costumes?categoryId=${costume.category.id}`}>
                  {costume.category.name}
                </Link>
              </li>
            )}
            <li className="breadcrumb-item active" aria-current="page">
              {costume.name}
            </li>
          </ol>
        </nav>

        <Row className="g-4">
          {/* Left Column (60%): Images, Description, Policies */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm p-3 mb-4 bg-white rounded">
              {costume.images && costume.images.length > 0 ? (
                <Carousel interval={null} className="costume-detail-carousel mb-3">
                  {costume.images.map((img) => (
                    <Carousel.Item key={img.id}>
                      <img
                        className="d-block w-100 rounded"
                        style={{ maxHeight: '480px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                        src={img.imageUrl}
                        alt={img.altText || costume.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImg;
                        }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <img
                  src={fallbackImg}
                  alt={costume.name}
                  className="w-100 rounded mb-3"
                  style={{ maxHeight: '480px', objectFit: 'contain' }}
                />
              )}

              <h3 className="fw-bold mb-2">{costume.name}</h3>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {costume.category && (
                  <Badge bg="primary" className="px-2 py-1">
                    {costume.category.name}
                  </Badge>
                )}
                {costume.characterName && (
                  <Badge bg="secondary" className="px-2 py-1">
                    Nhân vật: {costume.characterName}
                  </Badge>
                )}
                {costume.seriesName && (
                  <Badge bg="dark" className="px-2 py-1">
                    Tác phẩm: {costume.seriesName}
                  </Badge>
                )}
              </div>

              <hr />

              <h5 className="fw-bold mb-2">Mô tả trang phục & phụ kiện kèm theo</h5>
              <div
                className="text-secondary mb-4"
                style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}
              >
                {costume.description}
              </div>

              <div className="p-3 bg-light rounded border">
                <h6 className="fw-bold mb-2 text-primary">
                  <i className="bi bi-shop me-2"></i>Chính sách nhận & trả đồ tại cửa hàng
                </h6>
                <ul className="mb-0 small text-secondary ps-3">
                  <li>Khách hàng đến trực tiếp quầy thử đồ và kiểm tra phụ kiện trước khi nhận.</li>
                  <li>Thanh toán tiền thuê và đặt cọc bằng tiền mặt hoặc chuyển khoản tại quầy.</li>
                  <li>Cửa hàng hoàn trả 100% tiền cọc ngay khi nhận lại trang phục và phụ kiện nguyên vẹn.</li>
                  <li>Vui lòng mang theo Căn cước công dân (CCCD) để đối chiếu thông tin người thuê.</li>
                </ul>
              </div>
            </Card>
          </Col>

          {/* Right Column (40%): Live Booking & Quote Widget */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm p-4 sticky-top bg-white rounded" style={{ top: '24px' }}>
              <div className="d-flex justify-content-between align-items-baseline mb-3 pb-3 border-bottom">
                <div>
                  <small className="text-muted d-block">Giá thuê niêm yết</small>
                  <span className="text-danger fw-extrabold fs-3">
                    {costume.dailyPrice.toLocaleString('vi-VN')} ₫
                  </span>
                  <small className="text-muted"> / ngày</small>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Tiền cọc quy định</small>
                  <span className="fw-bold text-dark fs-5">
                    {costume.depositAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* 1. Size Selection */}
              <div className="mb-3">
                <Form.Label className="fw-bold small text-uppercase mb-2">
                  1. Chọn kích cỡ trang phục
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {costume.variants && costume.variants.length > 0 ? (
                    costume.variants.map((v) => (
                      <Button
                        key={v.id}
                        variant={selectedVariant?.id === v.id ? 'primary' : 'outline-secondary'}
                        className="px-3 py-2 fw-semibold"
                        onClick={() => setSelectedVariant(v)}
                      >
                        Size {v.size}
                      </Button>
                    ))
                  ) : (
                    <Badge bg="secondary">Không có sẵn kích cỡ</Badge>
                  )}
                </div>
              </div>

              {/* 2. Date Selection */}
              <div className="mb-3">
                <Form.Label className="fw-bold small text-uppercase mb-2">
                  2. Chọn khoảng ngày thuê (Theo ngày lịch VN)
                </Form.Label>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Ngày nhận đồ</Form.Label>
                      <Form.Control
                        type="date"
                        min={getToday()}
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (endDate < e.target.value) setEndDate(e.target.value);
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Ngày trả đồ</Form.Label>
                      <Form.Control
                        type="date"
                        min={startDate || getToday()}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* 3. Quantity Selection */}
              <div className="mb-3">
                <Form.Label className="small text-muted mb-1">Số lượng bộ</Form.Label>
                <Form.Select
                  size="sm"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  style={{ width: '100px' }}
                >
                  <option value={1}>1 bộ</option>
                  <option value={2}>2 bộ</option>
                  <option value={3}>3 bộ</option>
                </Form.Select>
              </div>

              {/* Availability Status Notification */}
              {checkingAvail && (
                <div className="py-2 text-center text-muted small">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang kiểm tra tồn kho theo ngày...
                </div>
              )}

              {availError && <Alert variant="danger" className="py-2 small">{availError}</Alert>}

              {availability && !checkingAvail && (
                <div className="mb-3">
                  {availability.isAvailable ? (
                    <Alert variant="success" className="py-2 mb-0 small d-flex align-items-center">
                      <i className="bi bi-check-circle-fill fs-5 me-2 text-success"></i>
                      <div>
                        <strong>CÒN HÀNG</strong> trong khoảng ngày đã chọn.
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Tối đa có thể thuê: {availability.availableQuantity} bộ
                        </div>
                      </div>
                    </Alert>
                  ) : (
                    <Alert variant="danger" className="py-2 mb-0 small d-flex align-items-center">
                      <i className="bi bi-x-circle-fill fs-5 me-2 text-danger"></i>
                      <div>
                        <strong>HẾT HÀNG</strong> trong khoảng ngày đã chọn.
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Vui lòng chọn kích cỡ khác hoặc đổi khoảng ngày thuê.
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              )}

              {/* 4. Price & Deposit Quote Summary */}
              {quote && availability?.isAvailable && (
                <div className="p-3 bg-light rounded border mb-3">
                  <h6 className="fw-bold mb-2 small text-uppercase">Bảng tính tiền chi tiết</h6>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">
                      Số ngày thuê ({quote.startDate} &rarr; {quote.endDate}):
                    </span>
                    <strong className="text-dark">{quote.rentalDays} ngày</strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">
                      Tiền thuê ({costume.dailyPrice.toLocaleString('vi-VN')} ₫ x {quote.rentalDays} ngày):
                    </span>
                    <strong>{quote.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-2">
                    <span className="text-muted">Tiền đặt cọc (hoàn lại 100%):</span>
                    <strong>{quote.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="fw-bold">Tổng thanh toán tại quầy:</span>
                    <span className="fw-bold text-danger fs-5">
                      {quote.totalDueAtStore.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              <Button
                variant="warning"
                size="lg"
                className="w-100 fw-bold py-3 btn-search-gold"
                disabled={!availability || !availability.isAvailable || checkingAvail}
                onClick={handleProceedToCheckout}
              >
                Tiến hành đặt thuê ngay <i className="bi bi-arrow-right ms-2"></i>
              </Button>
              <small className="text-muted text-center d-block mt-2" style={{ fontSize: '0.75rem' }}>
                Đơn thuê sẽ được giữ chỗ sau khi xác nhận. Không trừ tiền trực tuyến.
              </small>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

