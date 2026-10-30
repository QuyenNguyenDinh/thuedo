import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Modal } from 'react-bootstrap';
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

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo' | 'instore'>('vietqr');
  const [payOption, setPayOption] = useState<'rent_only' | 'full'>('rent_only');
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);

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

  // Calculate payment amount based on option
  const payAmount = quote
    ? payOption === 'rent_only'
      ? quote.totalRentalFee
      : quote.totalDueAtStore
    : 0;

  const transferContent = `COSR ${customerPhone ? customerPhone.slice(-6) : 'RENT'}`;
  const qrCodeUrl = `https://img.vietqr.io/image/MB-0988888888-compact2.png?amount=${payAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=COSRent%20Vietnam`;

  const copyToClipboard = (text: string, type: 'bank' | 'amount' | 'content') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Vui lòng tích xác nhận cam kết nhận và trả đồ trực tiếp tại cửa hàng.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const paymentLabel =
      paymentMethod === 'vietqr'
        ? `[Thanh toán: Chuyển khoản VietQR (${payOption === 'rent_only' ? 'Trả trước tiền thuê' : 'Trả trọn gói'})]`
        : paymentMethod === 'momo'
        ? '[Thanh toán: Ví điện tử MoMo]'
        : '[Thanh toán: Tiền mặt/Tại quầy]';

    const fullNote = `${paymentLabel} ${note.trim()}`.trim();

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        note: fullNote || undefined,
        startDate,
        endDate,
        items: [{ costumeVariantId: variantId, quantity }],
      };

      const res: any = await api.post('/rentals', payload);
      const createdOrder = res.data || res;
      setCreatedOrderId(createdOrder.id);

      if (paymentMethod === 'vietqr' || paymentMethod === 'momo') {
        setShowPaymentSuccessModal(true);
      } else {
        navigate(`/my-rentals/${createdOrder.id}`);
      }
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
          <h2 className="fw-bold mb-1 text-dark">Xác Nhận & Thanh Toán Đơn Đặt Thuê</h2>
          <p className="text-muted small">
            Bước 4/4: Chọn phương thức thanh toán, hoàn tất đặt giữ chỗ trang phục
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
              {/* Left Column: Order Item Summary & Payment Methods */}
              <Col lg={7}>
                {/* 1. Item info */}
                <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4">
                  <h5 className="fw-bold mb-3 text-dark">
                    <i className="bi bi-box-seam text-warning me-2"></i>Trang Phục Thuê
                  </h5>

                  <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                    <img
                      src={costume?.primaryImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800'}
                      alt={costume?.name}
                      style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: '8px' }}
                      className="me-3 shadow-sm"
                    />
                    <div>
                      <h6 className="fw-bold mb-1">{costume?.name}</h6>
                      <p className="text-muted small mb-1">
                        Kích cỡ: <strong className="text-dark">Size {variant?.size}</strong> | Số lượng:{' '}
                        <strong>{quantity} bộ</strong>
                      </p>
                      <small className="text-dark fw-semibold">
                        Đơn giá niêm yết: {costume?.dailyPrice.toLocaleString('vi-VN')} ₫ / ngày
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
                    <span className="text-muted">Tiền thuê ({quote?.rentalDays} ngày x {quantity} bộ):</span>
                    <strong className="fs-6">{quote?.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Tiền đặt cọc (hoàn lại 100% khi trả đồ):</span>
                    <strong className="fs-6">{quote?.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="fw-bold fs-5">TỔNG GIÁ TRỊ ĐƠN HÀNG:</span>
                    <span className="fw-bold fs-4 text-primary">
                      {quote?.totalDueAtStore.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </Card>

                {/* 2. Payment Method Selector */}
                <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4">
                  <h5 className="fw-bold mb-3 text-dark">
                    <i className="bi bi-credit-card-2-front-fill text-warning me-2"></i>
                    Chọn Phương Thức Thanh Toán
                  </h5>

                  {/* Option 1: VietQR */}
                  <div
                    className={`p-3 rounded border mb-3 cursor-pointer ${
                      paymentMethod === 'vietqr' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    onClick={() => setPaymentMethod('vietqr')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="radio"
                          name="paymentMethod"
                          id="pm-vietqr"
                          checked={paymentMethod === 'vietqr'}
                          onChange={() => setPaymentMethod('vietqr')}
                          className="me-3"
                        />
                        <div>
                          <strong className="text-dark d-block">
                            <i className="bi bi-qr-code-scan text-primary me-2"></i>
                            Chuyển khoản Ngân hàng (Mã VietQR tự động)
                          </strong>
                          <small className="text-muted">
                            Quét mã QR qua app ngân hàng bất kỳ (MB, VCB, Techcombank, BIDV, VPBank...)
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-success">Khuyên dùng</span>
                    </div>

                    {/* Sub-options for VietQR */}
                    {paymentMethod === 'vietqr' && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="fw-bold d-block mb-2 text-dark">Chọn số tiền thanh toán trước:</small>
                        <div className="d-flex gap-3 mb-3">
                          <Form.Check
                            type="radio"
                            name="payOption"
                            id="pay-rent"
                            label={`Thanh toán tiền thuê: ${quote?.totalRentalFee.toLocaleString('vi-VN')} ₫ (Cọc tại quầy)`}
                            checked={payOption === 'rent_only'}
                            onChange={() => setPayOption('rent_only')}
                            className="small"
                          />
                          <Form.Check
                            type="radio"
                            name="payOption"
                            id="pay-full"
                            label={`Thanh toán trọn gói: ${quote?.totalDueAtStore.toLocaleString('vi-VN')} ₫`}
                            checked={payOption === 'full'}
                            onChange={() => setPayOption('full')}
                            className="small"
                          />
                        </div>

                        {/* Interactive VietQR Display Box */}
                        <div className="bg-white p-3 rounded border shadow-sm">
                          <Row className="align-items-center">
                            <Col md={5} className="text-center mb-3 mb-md-0">
                              <img
                                src={qrCodeUrl}
                                alt="Mã VietQR thanh toán"
                                className="img-fluid rounded border"
                                style={{ maxHeight: '180px' }}
                              />
                              <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                                Quét bằng app Ngân hàng hoặc MoMo
                              </small>
                            </Col>
                            <Col md={7}>
                              <div className="small mb-2">
                                <span className="text-muted d-block">Ngân hàng thụ hưởng:</span>
                                <strong>MB Bank (Ngân hàng Quân Đội)</strong>
                              </div>
                              <div className="small mb-2 d-flex justify-content-between align-items-center">
                                <div>
                                  <span className="text-muted d-block">Số tài khoản:</span>
                                  <strong className="text-primary fs-6">0988888888</strong>
                                </div>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="py-0 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard('0988888888', 'bank');
                                  }}
                                >
                                  {copiedBank ? '✓ Đã chép' : 'Sao chép'}
                                </Button>
                              </div>
                              <div className="small mb-2 d-flex justify-content-between align-items-center">
                                <div>
                                  <span className="text-muted d-block">Số tiền chuyển:</span>
                                  <strong className="text-danger fs-6">{payAmount.toLocaleString('vi-VN')} ₫</strong>
                                </div>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="py-0 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(String(payAmount), 'amount');
                                  }}
                                >
                                  {copiedAmount ? '✓ Đã chép' : 'Sao chép'}
                                </Button>
                              </div>
                              <div className="small d-flex justify-content-between align-items-center">
                                <div>
                                  <span className="text-muted d-block">Nội dung chuyển khoản:</span>
                                  <strong className="text-dark bg-warning bg-opacity-25 px-2 py-0 rounded">
                                    {transferContent}
                                  </strong>
                                </div>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="py-0 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(transferContent, 'content');
                                  }}
                                >
                                  {copiedContent ? '✓ Đã chép' : 'Sao chép'}
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: MoMo */}
                  <div
                    className={`p-3 rounded border mb-3 cursor-pointer ${
                      paymentMethod === 'momo' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    onClick={() => setPaymentMethod('momo')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="pm-momo"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                        className="me-3"
                      />
                      <div>
                        <strong className="text-dark d-block">
                          <i className="bi bi-wallet2 text-danger me-2"></i>
                          Ví Điện Tử MoMo / ZaloPay
                        </strong>
                        <small className="text-muted">
                          Chuyển tiền nhanh qua số điện thoại ví MoMo: <strong>0988888888</strong> (COSRent Store)
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: In-Store */}
                  <div
                    className={`p-3 rounded border cursor-pointer ${
                      paymentMethod === 'instore' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    onClick={() => setPaymentMethod('instore')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="radio"
                        name="paymentMethod"
                        id="pm-instore"
                        checked={paymentMethod === 'instore'}
                        onChange={() => setPaymentMethod('instore')}
                        className="me-3"
                      />
                      <div>
                        <strong className="text-dark d-block">
                          <i className="bi bi-cash-stack text-success me-2"></i>
                          Thanh toán tiền mặt & đặt cọc trực tiếp tại quầy
                        </strong>
                        <small className="text-muted">
                          Giữ chỗ online miễn phí, thanh toán khi đến quầy thử đồ và nhận trang phục
                        </small>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Right Column: Customer Info & Agreement */}
              <Col lg={5}>
                <Card className="border-0 shadow-sm p-4 bg-white rounded sticky-top" style={{ top: '24px' }}>
                  <h5 className="fw-bold mb-3 text-dark">
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

                  <Form.Group className="mb-3">
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
                          Tôi xác nhận sẽ đến trực tiếp cửa hàng nhận và trả đồ đúng hẹn, mang theo CCCD và hoàn tất thủ tục bàn giao.
                        </span>
                      }
                      required
                    />
                  </Form.Group>

                  {/* Summary payment callout */}
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Hình thức thanh toán:</span>
                      <strong className="text-primary">
                        {paymentMethod === 'vietqr'
                          ? 'Mã VietQR'
                          : paymentMethod === 'momo'
                          ? 'Ví MoMo'
                          : 'Tại quầy'}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Số tiền cần thanh toán ngay:</span>
                      <strong className="fs-5 text-danger">
                        {paymentMethod === 'instore'
                          ? '0 ₫ (Trả tại quầy)'
                          : `${payAmount.toLocaleString('vi-VN')} ₫`}
                      </strong>
                    </div>
                  </div>

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
                        Đang xử lý đơn đặt thuê...
                      </>
                    ) : paymentMethod === 'vietqr' ? (
                      'Hoàn tất & Xác nhận đã chuyển khoản'
                    ) : (
                      'Xác nhận tạo đơn giữ chỗ'
                    )}
                  </Button>
                  <small className="text-muted text-center d-block mt-2" style={{ fontSize: '0.75rem' }}>
                    Cam kết hoàn 100% tiền cọc ngay khi hoàn trả trang phục.
                  </small>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Container>

      {/* Payment Success Modal */}
      <Modal
        show={showPaymentSuccessModal}
        onHide={() => navigate(`/my-rentals/${createdOrderId}`)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-success">
            <i className="bi bi-check-circle-fill me-2"></i>Đã Ghi Nhận Đơn Hàng Thành Công!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <img
              src={qrCodeUrl}
              alt="Mã QR thanh toán"
              style={{ width: '180px', height: '180px', objectFit: 'contain' }}
              className="border p-1 rounded shadow-sm"
            />
          </div>
          <h5 className="fw-bold text-dark mb-1">
            Số tiền: <span className="text-danger">{payAmount.toLocaleString('vi-VN')} ₫</span>
          </h5>
          <p className="text-muted small mb-3">
            Cửa hàng CosRent đã tiếp nhận đơn hàng của bạn. Nhân viên sẽ đối soát sao kê ngân hàng và duyệt đơn trong vòng 15-30 phút!
          </p>
          <div className="p-2 bg-light rounded text-start small mb-3">
            <div><strong>Nội dung chuyển khoản:</strong> <code>{transferContent}</code></div>
            <div><strong>Số tài khoản MB Bank:</strong> <code>0988888888</code></div>
          </div>
          <Button
            variant="primary"
            className="w-100 fw-bold"
            onClick={() => navigate(`/my-rentals/${createdOrderId}`)}
          >
            Xem chi tiết đơn hàng & Lịch sử thuê &rarr;
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};
