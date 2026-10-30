import React, { useEffect, useState } from 'react';
import { Container, Card, Nav, Button, Spinner, Alert, Modal, Pagination } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { RentalOrder, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const MyRentalsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [rentals, setRentals] = useState<RentalOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellingOrder, setCancellingOrder] = useState<RentalOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      params.set('page', page.toString());
      params.set('limit', '5');

      const res: any = await api.get(`/rentals?${params.toString()}`);
      setRentals(res.data?.items || res.items || []);
      const meta = res.data?.meta || res.meta;
      if (meta) {
        setTotalPages(meta.totalPages || 1);
        setTotalCount(meta.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đơn thuê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRentals();
    }
  }, [user, selectedStatus, page]);

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

  const handleOpenCancelModal = (order: RentalOrder) => {
    setCancellingOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);
    try {
      await api.post(`/rentals/${cancellingOrder.id}/cancel`, {
        reason: cancelReason || 'Khách hàng đổi ý',
      });
      setShowCancelModal(false);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn thuê.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">
              <i className="bi bi-box2-heart-fill text-warning me-2"></i>Đơn Thuê Của Tôi
            </h3>
            <p className="text-muted small mb-0">Theo dõi tiến trình xử lý và trạng thái đơn thuê tại cửa hàng</p>
          </div>
          <Link to="/costumes" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-plus-circle me-1"></i> Thuê thêm trang phục
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <Nav
          variant="pills"
          className="mb-4 bg-white p-2 rounded border shadow-sm"
          activeKey={selectedStatus}
          onSelect={(k) => {
            setSelectedStatus(k || 'ALL');
            setPage(1);
          }}
        >
          <Nav.Item>
            <Nav.Link eventKey="ALL">Tất cả đơn</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.PENDING}>Chờ xác nhận</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.CONFIRMED}>Đã xác nhận</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.RENTING}>Đang thuê</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.RETURNED}>Đã hoàn tất</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.CANCELLED}>Đã hủy</Nav.Link>
          </Nav.Item>
        </Nav>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5 bg-white rounded border shadow-sm">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Đang tải lịch sử đơn thuê...</p>
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-5 bg-white rounded border shadow-sm p-4">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
            <h5 className="fw-bold">Chưa có đơn thuê nào</h5>
            <p className="text-muted small mb-3">Bạn chưa có đơn đặt thuê nào ở mục này.</p>
            <Link to="/costumes" className="btn btn-primary btn-sm">
              Xem trang phục ngay
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {rentals.map((order) => (
              <Card key={order.id} className="border-0 shadow-sm p-3 bg-white rounded">
                <div className="d-flex flex-wrap justify-content-between align-items-center pb-2 mb-2 border-bottom">
                  <div>
                    <span className="fw-bold text-primary fs-6 me-2">{order.orderCode}</span>
                    <small className="text-muted">
                      Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                  <div>
                    <StatusBadge status={order.status} endDate={order.endDate} />
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-md-5">
                    <p className="mb-1 small">
                      <strong>Khoảng ngày thuê:</strong> {order.startDate} &rarr; {order.endDate} (
                      {order.rentalDays} ngày)
                    </p>
                    <p className="mb-0 small text-muted">
                      Người nhận: <strong>{order.customerName}</strong> ({order.customerPhone})
                    </p>
                  </div>

                  <div className="col-md-4">
                    <div className="small">
                      <span className="text-muted">Tiền thuê: </span>
                      <strong>{order.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
                    </div>
                    <div className="small">
                      <span className="text-muted">Tiền cọc: </span>
                      <strong>{order.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
                    </div>
                  </div>

                  <div className="col-md-3 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
                    <Link
                      to={`/my-rentals/${order.id}`}
                      className="btn btn-outline-primary btn-sm fw-semibold"
                    >
                      Chi tiết <i className="bi bi-chevron-right ms-1"></i>
                    </Link>

                    {order.status === OrderStatus.PENDING && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleOpenCancelModal(order)}
                      >
                        Hủy đơn
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 pt-2 border-top">
                <span className="small text-muted">
                  Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalCount} đơn thuê)
                </span>
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                      {p}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </Pagination>
              </div>
            )}
          </div>
        )}

        {/* Modal Confirm Cancel */}
        <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Xác nhận hủy đơn thuê</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small mb-3">
              Bạn có chắc chắn muốn hủy đơn thuê <strong>{cancellingOrder?.orderCode}</strong>? Sau khi hủy,
              lịch giữ chỗ sẽ được giải phóng cho các khách hàng khác.
            </p>
            <label className="form-label small fw-semibold">Lý do hủy đơn (Tùy chọn):</label>
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
              onClick={handleConfirmCancel}
            >
              {cancelling ? <Spinner animation="border" size="sm" /> : 'Xác nhận hủy đơn'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

