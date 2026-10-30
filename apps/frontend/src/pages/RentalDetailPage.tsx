import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import api from '../services/api';
import { RentalOrder, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { OrderStepper } from '../components/OrderStepper';

export const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<RentalOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/rentals/${id}`);
      setOrder(res.data || res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải chi tiết đơn thuê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchDetail();
    }
  }, [user, id]);

  if (authLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await api.post(`/rentals/${order.id}/cancel`, {
        reason: cancelReason || 'Khách hàng đổi ý',
      });
      setShowCancelModal(false);
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn thuê.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Đang tải chi tiết đơn thuê...</p>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Không tìm thấy đơn thuê.'}</Alert>
        <Link to="/my-rentals" className="btn btn-outline-primary">
          &larr; Quay lại danh sách đơn của tôi
        </Link>
      </Container>
    );
  }

  const qrAmount = order.totalRentalFee;
  const qrTransferContent = `COSR ${order.orderCode || order.id.slice(0, 8)}`;
  const qrCodeUrl = `https://img.vietqr.io/image/MB-0988888888-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrTransferContent)}&accountName=COSRent%20Vietnam`;

  return (
    <div className="py-4">
      <Container>
        {/* Back link */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link to="/my-rentals" className="text-decoration-none small text-muted">
            &larr; Quay lại danh sách đơn của tôi
          </Link>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => window.print()}
            className="d-flex align-items-center gap-1"
          >
            <i className="bi bi-printer"></i>
            <span>In phiếu giữ chỗ & QR</span>
          </Button>
        </div>

        {/* Order Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-white p-3 rounded border shadow-sm">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fw-bold mb-0 text-dark">{order.orderCode}</h4>
              <StatusBadge status={order.status} endDate={order.endDate} />
            </div>
            <small className="text-muted">
              Ngày tạo đơn:{' '}
              {new Date(order.createdAt).toLocaleString('vi-VN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </small>
          </div>

          <div className="d-flex gap-2 align-items-center">
            {order.status === OrderStatus.PENDING && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowCancelModal(true)}
              >
                <i className="bi bi-x-circle me-1"></i> Hủy đơn thuê
              </Button>
            )}
          </div>
        </div>

        {/* Visual Stepper */}
        <OrderStepper status={order.status} />

        <Row className="g-4">
          {/* Left Column: Items Snapshot & Pricing */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4">
              <h5 className="fw-bold mb-3 text-dark">
                <i className="bi bi-receipt text-warning me-2"></i>Chi Tiết Mặt Hàng Thuê (Snapshot)
              </h5>

              <Table responsive className="align-middle mb-4">
                <thead className="table-light">
                  <tr>
                    <th>Trang phục</th>
                    <th>Size</th>
                    <th>Đơn giá/ngày</th>
                    <th>Số ngày</th>
                    <th>SL</th>
                    <th>Tiền thuê</th>
                    <th>Tiền cọc</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.costumeNameSnapshot}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.sizeSnapshot}
                        </span>
                      </td>
                      <td>{item.dailyPriceSnapshot.toLocaleString('vi-VN')} ₫</td>
                      <td>{order.rentalDays}</td>
                      <td>{item.quantity}</td>
                      <td className="fw-bold text-primary">
                        {item.lineRentalFee.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="text-secondary">
                        {item.lineDeposit.toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="p-3 bg-light rounded">
                <div className="d-flex justify-content-between mb-2 small">
                  <span className="text-muted">Tổng tiền thuê dịch vụ:</span>
                  <strong className="fs-6">{order.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 small">
                  <span className="text-muted">Tổng tiền đặt cọc giữ đồ:</span>
                  <strong className="fs-6">{order.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
                </div>
                {order.status === OrderStatus.RETURNED && (
                  <div className="d-flex justify-content-between mb-2 small text-success">
                    <span>Số tiền cọc đã hoàn trả thực tế:</span>
                    <strong className="fs-6">
                      +{order.actualDepositReturned.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                )}
                <hr className="my-2" />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Tổng thanh toán ban đầu tại quầy:</span>
                  <span className="fw-bold text-primary fs-5">
                    {(order.totalRentalFee + order.totalDeposit).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </Card>

            {/* Status Histories Audit Trail */}
            <Card className="border-0 shadow-sm p-4 bg-white rounded">
              <h5 className="fw-bold mb-3 text-dark">
                <i className="bi bi-clock-history text-warning me-2"></i>Lịch Sử Xử Lý Đơn Hàng
              </h5>

              {order.statusHistories && order.statusHistories.length > 0 ? (
                <div className="timeline">
                  {order.statusHistories.map((h, i) => (
                    <div key={h.id} className="d-flex mb-3 pb-2 border-bottom">
                      <div className="me-3">
                        <i className="bi bi-dot fs-2 text-primary"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="small">
                            {h.fromStatus ? `${h.fromStatus} → ` : ''}
                            <span className="text-primary">{h.toStatus}</span>
                          </strong>
                          <small className="text-muted">
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </small>
                        </div>
                        <p className="mb-1 small text-dark">{h.note}</p>
                        <small className="text-muted">Thực hiện bởi: {h.changedByName}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mb-0">Chưa có lịch sử cập nhật.</p>
              )}
            </Card>
          </Col>

          {/* Right Column: Customer Info & In-Store Notice & VietQR */}
          <Col lg={4}>
            {/* VietQR Payment box if order is PENDING */}
            {order.status === OrderStatus.PENDING && (
              <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4 border-top border-4 border-warning">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-qr-code-scan text-primary me-2"></i>Mã VietQR Thanh Toán
                  </h6>
                  <span className="badge bg-warning text-dark">Chờ thanh toán</span>
                </div>
                <p className="small text-muted mb-3">
                  Quét mã QR qua app ngân hàng bất kỳ để hoàn tất tiền thuê và giữ chỗ ưu tiên:
                </p>
                <div className="text-center mb-3">
                  <img
                    src={qrCodeUrl}
                    alt="Mã QR thanh toán đơn hàng"
                    className="img-fluid border p-1 rounded"
                    style={{ maxHeight: '170px' }}
                  />
                </div>
                <div className="bg-light p-2 rounded small">
                  <div><strong>Ngân hàng:</strong> MB Bank</div>
                  <div><strong>Số tài khoản:</strong> <code>0988888888</code></div>
                  <div><strong>Số tiền:</strong> <span className="text-danger fw-bold">{qrAmount.toLocaleString('vi-VN')} ₫</span></div>
                  <div><strong>Nội dung:</strong> <code>{qrTransferContent}</code></div>
                </div>
              </Card>
            )}

            <Card className="border-0 shadow-sm p-4 bg-white rounded mb-4">
              <h6 className="fw-bold mb-3 text-uppercase text-muted small">
                Thông Tin Nhận Đồ Tại Cửa Hàng
              </h6>

              <div className="mb-2 small">
                <span className="text-muted d-block">Người nhận:</span>
                <strong>{order.customerName}</strong>
              </div>
              <div className="mb-2 small">
                <span className="text-muted d-block">Số điện thoại:</span>
                <strong>{order.customerPhone}</strong>
              </div>
              <div className="mb-2 small">
                <span className="text-muted d-block">Khoảng ngày hẹn thuê:</span>
                <strong>
                  {order.startDate} &rarr; {order.endDate} ({order.rentalDays} ngày)
                </strong>
              </div>
              {order.note && (
                <div className="mb-2 small">
                  <span className="text-muted d-block">Ghi chú & Phương thức thanh toán:</span>
                  <em>{order.note}</em>
                </div>
              )}
            </Card>

            <Card className="border-0 shadow-sm p-4 bg-white rounded">
              <h6 className="fw-bold mb-2 text-primary">
                <i className="bi bi-geo-alt-fill me-1 text-warning"></i> Địa Điểm Cửa Hàng
              </h6>
              <p className="small text-muted mb-2">
                123 Đường Láng, Đống Đa, Hà Nội (Mở cửa 08:00 – 21:00)
              </p>
              <p className="small text-muted mb-0">
                Khi đến nhận đồ, vui lòng đưa mã đơn <strong>{order.orderCode}</strong> cho nhân viên tại quầy.
              </p>
            </Card>
          </Col>
        </Row>

        {/* Modal Confirm Cancel */}
        <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Xác nhận hủy đơn thuê</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small mb-3">
              Bạn có chắc chắn muốn hủy đơn <strong>{order.orderCode}</strong>? Sau khi hủy,
              trang phục sẽ được mở lại cho khách khác thuê.
            </p>
            <label className="form-label small fw-semibold">Lý do hủy:</label>
            <textarea
              className="form-control form-control-sm"
              rows={2}
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowCancelModal(false)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={cancelling}
              onClick={handleCancelOrder}
            >
              {cancelling ? <Spinner animation="border" size="sm" /> : 'Xác nhận hủy'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};
