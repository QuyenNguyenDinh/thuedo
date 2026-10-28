import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { useSearchParams, useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, CostumeVariant, CalculatedQuote } from '../types';
import { useAuth } from '../context/AuthContext';

export const CheckoutPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const variantId = searchParams.get('variantId') || '';
  const costumeId = searchParams.get('costumeId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const quantity = parseInt(searchParams.get('quantity') || '1', 10);

  const [costume, setCostume] = useState<Costume | null>(null);
  const [variant, setVariant] = useState<CostumeVariant | null>(null);
  const [quote, setQuote] = useState<CalculatedQuote | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!variantId || !costumeId || !startDate || !endDate) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [costumeRes, quoteRes]: any = await Promise.all([
          api.get(`/costumes/${costumeId}`),
          api.post('/rental-quotes', {
            startDate,
            endDate,
            items: [{ costumeVariantId: variantId, quantity }],
          }),
        ]);

        const cData = costumeRes.data || costumeRes;
        setCostume(cData);
        const vData = cData.variants?.find((v: CostumeVariant) => v.id === variantId);
        setVariant(vData || null);
        setQuote(quoteRes.data || quoteRes);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tính toán chi phí đơn thuê.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [variantId, costumeId, startDate, endDate, quantity]);

  if (authLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.search)}`} replace />;
  }

  if (!variantId || !costumeId) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Chưa chọn trang phục cần thuê. Vui lòng quay lại danh sách trang phục.
        </Alert>
        <Link to="/costumes" className="btn btn-primary">
          Xem danh sách trang phục
        </Link>
      </Container>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Vui lòng tích xác nhận cam kết nhận và trả đồ trực tiếp tại cửa hàng.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        note: note.trim() || undefined,
        startDate,
        endDate,
        items: [{ costumeVariantId: variantId, quantity }],
      };

      const res: any = await api.post('/rentals', payload);
      const createdOrder = res.data || res;
      navigate(`/my-rentals/${createdOrder.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo đơn đặt thuê không thành công.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-5 bg-light">
      <Container>
        <div className="mb-4 text-center">
          <h2 className="fw-bold mb-1">Xác Nhận Đơn Đặt Thuê Trang Phục</h2>
          <p className="text-muted small">
            Bước 4/4: Kiểm tra thông tin, xác nhận đặt giữ chỗ tại cửa hàng
          </p>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Đang nạp thông tin đơn thuê...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmitOrder}>
            <Row className="g-4">
              {/* Left Column: Order Item Summary */}
              <Col lg={7}>
                <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-box-seam text-warning me-2"></i>Trang Phục Thuê
                  </h5>

                  <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                    <img
                      src={costume?.primaryImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800'}
                      alt={costume?.name}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                      className="me-3"
                    />
                    <div>
                      <h6 className="fw-bold mb-1">{costume?.name}</h6>
                      <p className="text-muted small mb-1">
                        Kích cỡ: <strong className="text-dark">Size {variant?.size}</strong> | Số lượng:{' '}
                        <strong>{quantity} bộ</strong>
                      </p>
                      <small className="text-danger fw-semibold">
                        Đơn giá: {costume?.dailyPrice.toLocaleString('vi-VN')} ₫ / ngày
                      </small>
                    </div>
                  </div>

                  <Table borderless size="sm" className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Ngày nhận đồ tại quầy:</td>
                        <td className="text-end fw-bold">{startDate}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Ngày hoàn trả tại quầy:</td>
                        <td className="text-end fw-bold">{endDate}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Tổng số ngày thuê:</td>
                        <td className="text-end fw-bold">{quote?.rentalDays} ngày (tính cả nhận & trả)</td>
                      </tr>
                    </tbody>
                  </Table>

                  <hr />

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tổng tiền thuê ({quote?.rentalDays} ngày):</span>
                    <strong className="fs-6">{quote?.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tổng tiền cọc (hoàn lại 100% khi trả đồ):</span>
                    <strong className="fs-6">{quote?.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="fw-bold fs-5">TỔNG CẦN CHUẨN BỊ TẠI QUẦY:</span>
                    <span className="fw-bold fs-4 text-danger">
                      {quote?.totalDueAtStore.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </Card>

                <div className="p-3 bg-white rounded border shadow-sm">
                  <h6 className="fw-bold text-primary mb-2">
                    <i className="bi bi-info-circle-fill me-2"></i>Quy trình thanh toán & nhận đồ
                  </h6>
                  <p className="small text-muted mb-0">
                    Đơn hàng sẽ ở trạng thái <strong>CHỜ XÁC NHẬN (PENDING)</strong>. Cửa hàng sẽ kiểm tra và duyệt đơn
                    trong vòng 30 phút. Bạn không cần thanh toán online, toàn bộ tiền thuê và tiền cọc sẽ được thanh toán
                    trực tiếp khi nhận đồ tại cửa hàng.
                  </p>
                </div>
              </Col>

              {/* Right Column: Customer Info & Agreement */}
              <Col lg={5}>
                <Card className="border-0 shadow-sm p-4 bg-white rounded">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-person-lines-fill text-warning me-2"></i>Thông Tin Người Nhận
                  </h5>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Tên người nhận đồ *</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Số điện thoại liên hệ *</Form.Label>
                    <Form.Control
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-semibold">Ghi chú cho cửa hàng</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Ví dụ: Tôi sẽ tới nhận đồ lúc 14h chiều..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="confirmAgreement"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      label={
                        <span className="small text-muted">
                          Tôi xác nhận sẽ đến trực tiếp cửa hàng nhận và trả đồ đúng hẹn, mang theo CCCD và thanh toán
                          trực tiếp tại quầy.
                        </span>
                      }
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="warning"
                    size="lg"
                    className="btn-search-gold w-100 fw-bold py-3"
                    disabled={submitting || !agreeTerms}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang tạo đơn đặt thuê...
                      </>
                    ) : (
                      'Xác nhận tạo đơn thuê'
                    )}
                  </Button>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Container>
    </div>
  );
};

