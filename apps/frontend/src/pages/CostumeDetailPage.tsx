import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  Spinner,
  Alert,
  Accordion,
  Modal,
} from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, CostumeVariant, AvailabilityResult, CalculatedQuote } from '../types';
import { useAuth } from '../context/AuthContext';
import { getToday, getDayOffset } from '../utils/date';
import { RatingBadge, getPseudoRating } from '../components/RatingBadge';
import { isInWishlist, toggleWishlist } from '../services/wishlist';

export const CostumeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [costume, setCostume] = useState<Costume | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  // Wishlist state
  const [saved, setSaved] = useState<boolean>(() => (id ? isInWishlist(id) : false));

  // Booking selections
  const [selectedVariant, setSelectedVariant] = useState<CostumeVariant | null>(null);

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

  useEffect(() => {
    if (id) {
      setSaved(isInWishlist(id));
    }
  }, [id]);

  const handleHeartClick = () => {
    if (!id) return;
    const newState = toggleWishlist(id);
    setSaved(newState);
  };

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

    const params = new URLSearchParams({
      variantId: selectedVariant.id,
      costumeId: costume!.id,
      startDate,
      endDate,
      quantity: String(quantity),
    });

    if (!user) {
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

  const rating = getPseudoRating(costume.id);

  // Prepare images list
  const allImages = costume.images && costume.images.length > 0
    ? costume.images.map((img) => img.imageUrl)
    : [costume.primaryImage || fallbackImg];

  // Fill up to 5 images for the grid
  const galleryImages = [...allImages];
  while (galleryImages.length < 5) {
    galleryImages.push(fallbackImg);
  }

  return (
    <div className="py-4">
      <Container>
        {/* Breadcrumb & Actions */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-0">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">Trang chủ</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/costumes" className="text-decoration-none">Trang phục</Link>
              </li>
              {costume.category && (
                <li className="breadcrumb-item">
                  <Link to={`/costumes?categoryId=${costume.category.id}`} className="text-decoration-none">
                    {costume.category.name}
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                {costume.name}
              </li>
            </ol>
          </nav>

          <Button
            variant={saved ? 'outline-danger' : 'outline-secondary'}
            size="sm"
            className="d-flex align-items-center gap-1 rounded-pill px-3"
            onClick={handleHeartClick}
          >
            <i className={`bi ${saved ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
            <span>{saved ? 'Đã lưu' : 'Lưu lại'}</span>
          </Button>
        </div>

        {/* Title & Badges */}
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
          <div>
            <h2 className="fw-bold mb-2 text-dark">{costume.name}</h2>
            <div className="d-flex flex-wrap gap-2 align-items-center">
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
              <span className="text-muted small">
                <i className="bi bi-geo-alt-fill text-danger me-1"></i>Nhận tại quầy CosRent Hà Nội
              </span>
            </div>
          </div>

          {/* Booking Rating Pill Top */}
          <div className="d-none d-md-block">
            <RatingBadge
              score={rating.score}
              reviewCount={rating.reviewCount}
              label={rating.label}
              size="sm"
            />
          </div>
        </div>

        {/* Booking Photo Gallery Grid (1 Large Left + 4 Small Right) */}
        <div className="photo-gallery-grid mb-4">
          <div
            className="photo-gallery-main"
            onClick={() => {
              setActiveImageIndex(0);
              setShowLightbox(true);
            }}
          >
            <img
              src={galleryImages[0]}
              alt={costume.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImg;
              }}
            />
          </div>
          <div className="photo-gallery-thumbs">
            {galleryImages.slice(1, 5).map((imgUrl, idx) => (
              <div
                key={idx}
                className="photo-gallery-thumb"
                onClick={() => {
                  setActiveImageIndex(idx + 1);
                  setShowLightbox(true);
                }}
              >
                <img
                  src={imgUrl}
                  alt={`${costume.name} thumb ${idx + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImg;
                  }}
                />
                {idx === 3 && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
                  >
                    <span><i className="bi bi-images me-1"></i>Xem ảnh ({allImages.length})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Row className="g-4">
          {/* Left Column (60%): Rating Breakdown, Accessories Checklist, Description, Policies */}
          <Col lg={7}>
            {/* Booking.com Rating Detail Section */}
            <RatingBadge
              score={rating.score}
              reviewCount={rating.reviewCount}
              label={rating.label}
              size="lg"
              showDetails
            />

            {/* Included Accessories Checklist */}
            <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded">
              <h5 className="fw-bold mb-3 text-dark">
                <i className="bi bi-bag-check-fill text-success me-2"></i>
                Bộ trang phục bàn giao gồm những gì?
              </h5>
              <p className="text-muted small mb-3">
                CosRent cam kết bàn giao đầy đủ chi tiết như hình, đã được là phẳng và khử khuẩn trước giờ nhận.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="accessory-badge">
                  <i className="bi bi-check-circle-fill me-2"></i>Bộ trang phục chính (Áo + Váy/Quần chuẩn form)
                </span>
                <span className="accessory-badge">
                  <i className="bi bi-check-circle-fill me-2"></i>Tóc giả (Wig) chuyên dụng đã uốn & tạo nếp
                </span>
                <span className="accessory-badge">
                  <i className="bi bi-check-circle-fill me-2"></i>Phụ kiện cài áo, huy hiệu & thắt lưng nhân vật
                </span>
                <span className="accessory-badge">
                  <i className="bi bi-check-circle-fill me-2"></i>Đạo cụ cầm tay / Vũ khí mô hình xốp an toàn
                </span>
                <span className="accessory-badge">
                  <i className="bi bi-check-circle-fill me-2"></i>Bọc bảo vệ & móc treo cao cấp CosRent
                </span>
              </div>
            </Card>

            {/* Description Card */}
            <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded">
              <h5 className="fw-bold mb-3 text-dark">Mô tả chi tiết & Thông số chất liệu</h5>
              <div
                className="text-secondary mb-3"
                style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}
              >
                {costume.description}
              </div>

              {/* In-store pickup policies */}
              <div className="p-3 bg-light rounded border mt-3">
                <h6 className="fw-bold mb-2 text-primary">
                  <i className="bi bi-shop me-2"></i>Chính sách nhận & trả đồ tại quầy cửa hàng
                </h6>
                <ul className="mb-0 small text-secondary ps-3" style={{ lineHeight: '1.8' }}>
                  <li>Khách hàng đến trực tiếp quầy thử đồ và kiểm tra phụ kiện trước khi nhận.</li>
                  <li>Thanh toán tiền thuê và đặt cọc bằng tiền mặt hoặc chuyển khoản tại quầy.</li>
                  <li>Cửa hàng hoàn trả 100% tiền cọc ngay khi nhận lại trang phục và phụ kiện nguyên vẹn.</li>
                  <li>Vui lòng mang theo Căn cước công dân (CCCD) để đối chiếu thông tin người thuê.</li>
                </ul>
              </div>
            </Card>

            {/* FAQ Accordion Section Booking style */}
            <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded">
              <h5 className="fw-bold mb-3 text-dark">
                <i className="bi bi-question-circle-fill text-primary me-2"></i>
                Câu hỏi thường gặp về dịch vụ thuê đồ
              </h5>
              <Accordion defaultActiveKey="0" flush>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>1. Tôi có được thử đồ trực tiếp trước khi nhận không?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Có! Cửa hàng có phòng thử đồ chuyên biệt trang bị gương toàn thân và đèn chụp ảnh. Nếu trang phục không vừa size, nhân viên sẽ hỗ trợ bạn đổi sang kích cỡ khác nếu kho đồ còn trống.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>2. Quy trình đặt cọc và hoàn trả cọc diễn ra như thế nào?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Tiền đặt cọc được nộp trực tiếp tại quầy lúc bàn giao đồ (tiền mặt hoặc chuyển khoản). Ngay khi bạn trả lại trang phục kèm đầy đủ phụ kiện, nhân viên sẽ kiểm tra và hoàn trả 100% tiền cọc ngay tại chỗ trong vòng 2 phút.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>3. Nếu trang phục bị lấm bẩn hoặc sút chỉ nhẹ thì sao?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    CosRent hiểu rằng trong quá trình tham gia lễ hội có thể bị dính bụi bẩn thông thường. Các vết bẩn giặt tẩy được sẽ hoàn toàn MIỄN PHÍ. Khách hàng chỉ phải chịu phí bồi hoàn nếu làm mất phụ kiện hoặc làm rách hỏng không thể phục hồi.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                  <Accordion.Header>4. Tôi có thể hủy hoặc đổi ngày sau khi đặt không?</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Bạn hoàn toàn có thể chủ động hủy đơn miễn phí trên trang "Đơn thuê của tôi" khi đơn hàng đang ở trạng thái <code>Chờ duyệt (PENDING)</code>.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card>
          </Col>

          {/* Right Column (40%): Live Booking & Quote Widget */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm p-4 sticky-top bg-white rounded" style={{ top: '24px' }}>
              {/* Urgency social proof */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <small className="text-muted">
                  <i className="bi bi-eye-fill text-primary me-1"></i>14 khách đã xem hôm nay
                </small>
                <span className="badge bg-success bg-opacity-10 text-success">
                  <i className="bi bi-clock-history me-1"></i>Giữ chỗ nhanh
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-baseline mb-3 pb-3 border-bottom">
                <div>
                  <small className="text-muted d-block">Giá thuê ưu đãi</small>
                  <span className="fw-extrabold fs-3 text-dark">
                    {costume.dailyPrice.toLocaleString('vi-VN')} ₫
                  </span>
                  <small className="text-muted"> / ngày</small>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Tiền cọc quy định</small>
                  <span className="fw-bold text-secondary fs-6">
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
                    <div>
                      {availability.availableQuantity === 1 && (
                        <div className="urgency-badge w-100 mb-2 justify-content-center">
                          <i className="bi bi-fire me-2"></i>Chỉ còn đúng 1 bộ duy nhất trong ngày bạn chọn!
                        </div>
                      )}
                      <Alert variant="success" className="py-2 mb-0 small d-flex align-items-center">
                        <i className="bi bi-check-circle-fill fs-5 me-2 text-success"></i>
                        <div>
                          <strong>CÒN HÀNG</strong> trong khoảng ngày đã chọn.
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Tối đa có thể thuê: {availability.availableQuantity} bộ
                          </div>
                        </div>
                      </Alert>
                    </div>
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
                    <span className="fw-bold text-dark fs-5">
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

              {/* Booking guarantees */}
              <div className="mt-3 pt-3 border-top small text-muted">
                <div className="mb-1"><i className="bi bi-check2 text-success me-1"></i>Miễn phí hủy đơn khi chưa duyệt</div>
                <div className="mb-1"><i className="bi bi-check2 text-success me-1"></i>Thử đồ trực tiếp tại cửa hàng</div>
                <div><i className="bi bi-check2 text-success me-1"></i>Hỗ trợ đổi size nếu kho còn trống</div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Lightbox Modal for Fullscreen Photo Viewing */}
      <Modal
        show={showLightbox}
        onHide={() => setShowLightbox(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">{costume.name} - Ảnh chi tiết</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 text-center bg-dark">
          <img
            src={allImages[activeImageIndex] || fallbackImg}
            alt={costume.name}
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2 py-2">
          {allImages.map((imgUrl, i) => (
            <img
              key={i}
              src={imgUrl}
              alt=""
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'cover',
                borderRadius: '4px',
                cursor: 'pointer',
                border: activeImageIndex === i ? '2px solid var(--accent-gold)' : '1px solid #ccc',
              }}
              onClick={() => setActiveImageIndex(i)}
            />
          ))}
        </Modal.Footer>
      </Modal>
    </div>
  );
};
