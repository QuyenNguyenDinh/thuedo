import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Modal,
  Row,
  Col,
  Nav,
  Pagination,
} from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { RentalOrder, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

export const AdminRentalsPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [rentals, setRentals] = useState<RentalOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Action Modals
  const [activeOrder, setActiveOrder] = useState<RentalOrder | null>(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Deliver modal
  const [showDeliverModal, setShowDeliverModal] = useState<boolean>(false);
  const [deliverNote, setDeliverNote] = useState<string>('');

  // Return modal
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [actualDepositReturned, setActualDepositReturned] = useState<number>(0);
  const [returnNote, setReturnNote] = useState<string>('');

  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (keyword.trim()) params.set('keyword', keyword.trim());
      params.set('page', page.toString());
      params.set('limit', '10');

      const res: any = await api.get(`/admin/rentals?${params.toString()}`);
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
    if (isAdmin) {
      fetchRentals();
    }
  }, [isAdmin, selectedStatus, page]);

  if (authLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Action Handlers
  const handleConfirm = async (order: RentalOrder) => {
    if (!window.confirm(`Xác nhận duyệt đơn ${order.orderCode}?`)) return;
    setProcessing(true);
    try {
      await api.post(`/admin/rentals/${order.id}/confirm`);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xác nhận đơn.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReject = (order: RentalOrder) => {
    setActiveOrder(order);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!activeOrder) return;
    setProcessing(true);
    try {
      await api.post(`/admin/rentals/${activeOrder.id}/reject`, {
        reason: rejectReason || 'Cửa hàng từ chối do vấn đề kỹ thuật',
      });
      setShowRejectModal(false);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể từ chối đơn.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenDeliver = (order: RentalOrder) => {
    setActiveOrder(order);
    setDeliverNote('Đã thu tiền và giao đủ phụ kiện tại quầy');
    setShowDeliverModal(true);
  };

  const handleConfirmDeliver = async () => {
    if (!activeOrder) return;
    setProcessing(true);
    try {
      await api.post(`/admin/rentals/${activeOrder.id}/deliver`, {
        note: deliverNote,
      });
      setShowDeliverModal(false);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bàn giao trang phục.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenReturn = (order: RentalOrder) => {
    setActiveOrder(order);
    setActualDepositReturned(order.totalDeposit);
    setReturnNote('Khách trả đồ đúng hạn, trang phục nguyên vẹn');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!activeOrder) return;
    setProcessing(true);
    try {
      await api.post(`/admin/rentals/${activeOrder.id}/return`, {
        actualDepositReturned: Number(actualDepositReturned),
        note: returnNote,
      });
      setShowReturnModal(false);
      fetchRentals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi nhận trả đồ.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">
              <i className="bi bi-receipt-cutoff text-warning me-2"></i>Quản Lý & Xử Lý Đơn Thuê
            </h3>
            <p className="text-muted small mb-0">
              Tiếp nhận, xác nhận, ghi nhận giao đồ tại quầy và nhận trả đồ kèm hoàn cọc
            </p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={fetchRentals}>
            <i className="bi bi-arrow-clockwise me-1"></i> Làm mới danh sách
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Nav
          variant="pills"
          className="mb-3 bg-white p-2 rounded border shadow-sm"
          activeKey={selectedStatus}
          onSelect={(k) => {
            setSelectedStatus(k || 'ALL');
            setPage(1);
          }}
        >
          <Nav.Item>
            <Nav.Link eventKey="ALL">Tất cả</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.PENDING}>Chờ duyệt (PENDING)</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.CONFIRMED}>Đã xác nhận (CONFIRMED)</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.RENTING}>Đang thuê (RENTING)</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.RETURNED}>Đã trả đồ (RETURNED)</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey={OrderStatus.CANCELLED}>Đã hủy / Từ chối</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Search */}
        <Card className="border-0 shadow-sm p-3 bg-white rounded mb-4">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchRentals();
            }}
          >
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng hoặc số điện thoại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="submit" variant="primary" className="fw-semibold px-4 text-nowrap">
                Tìm kiếm
              </Button>
            </div>
          </Form>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5 bg-white rounded border shadow-sm">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Đang tải danh sách đơn...</p>
          </div>
        ) : (
          <Card className="border-0 shadow-sm bg-white rounded overflow-hidden">
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng & SĐT</th>
                  <th>Khoảng ngày thuê</th>
                  <th>Tiền thuê</th>
                  <th>Tiền cọc</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Xử lý nghiệp vụ</th>
                </tr>
              </thead>
              <tbody>
                {rentals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Không có đơn thuê nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  rentals.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="fw-bold text-primary">{order.orderCode}</span>
                        <small className="d-block text-muted">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <div className="fw-semibold">{order.customerName}</div>
                        <small className="text-muted">{order.customerPhone}</small>
                      </td>
                      <td>
                        <div className="small">
                          {order.startDate} &rarr; {order.endDate}
                        </div>
                        <Badge bg="light" text="dark" className="border">
                          {order.rentalDays} ngày
                        </Badge>
                      </td>
                      <td className="fw-bold text-dark">
                        {order.totalRentalFee.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="text-secondary small">
                        {order.totalDeposit.toLocaleString('vi-VN')} ₫
                      </td>
                      <td>
                        <StatusBadge status={order.status} endDate={order.endDate} />
                      </td>
                      <td className="text-end text-nowrap">
                        {order.status === OrderStatus.PENDING && (
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="success"
                              onClick={() => handleConfirm(order)}
                              disabled={processing}
                            >
                              Duyệt
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleOpenReject(order)}
                              disabled={processing}
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}

                        {order.status === OrderStatus.CONFIRMED && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="fw-bold"
                            onClick={() => handleOpenDeliver(order)}
                            disabled={processing}
                          >
                            <i className="bi bi-box-arrow-up-right me-1"></i> Bàn giao đồ
                          </Button>
                        )}

                        {order.status === OrderStatus.RENTING && (
                          <Button
                            variant="warning"
                            size="sm"
                            className="fw-bold"
                            onClick={() => handleOpenReturn(order)}
                            disabled={processing}
                          >
                            <i className="bi bi-box-arrow-in-down-left me-1"></i> Nhận trả đồ
                          </Button>
                        )}

                        {order.status === OrderStatus.RETURNED && (
                          <small className="text-success fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i> Hoàn tất
                          </small>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-light">
                <span className="small text-muted">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalCount} đơn thuê)
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
          </Card>
        )}

        {/* Modal Reject */}
        <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Từ chối đơn thuê {activeOrder?.orderCode}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small text-muted mb-2">
              Lịch giữ chỗ sẽ được giải phóng ngay lập tức sau khi từ chối.
            </p>
            <Form.Group>
              <Form.Label className="small fw-semibold">Lý do từ chối *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập lý do từ chối gửi khách hàng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={processing || !rejectReason.trim()}
              onClick={handleConfirmReject}
            >
              {processing ? <Spinner animation="border" size="sm" /> : 'Xác nhận từ chối'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Deliver */}
        <Modal show={showDeliverModal} onHide={() => setShowDeliverModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Bàn giao trang phục tại quầy</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small mb-2">
              Mã đơn: <strong>{activeOrder?.orderCode}</strong> – Khách hàng: <strong>{activeOrder?.customerName}</strong>
            </p>
            <div className="p-3 bg-light rounded mb-3 small">
              <div>
                Tiền thuê cần thu: <strong>{activeOrder?.totalRentalFee.toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div>
                Tiền cọc cần thu: <strong>{activeOrder?.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div className="text-danger fw-bold mt-1">
                TỔNG THU TẠI QUẦY: {((activeOrder?.totalRentalFee || 0) + (activeOrder?.totalDeposit || 0)).toLocaleString('vi-VN')} ₫
              </div>
            </div>
            <Form.Group>
              <Form.Label className="small fw-semibold">Biên bản tình trạng đồ bàn giao</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowDeliverModal(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={processing}
              onClick={handleConfirmDeliver}
            >
              {processing ? <Spinner animation="border" size="sm" /> : 'Xác nhận đã giao đồ'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Return & Refund Deposit */}
        <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Nhận trả đồ & Hoàn trả tiền cọc</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small mb-2">
              Mã đơn: <strong>{activeOrder?.orderCode}</strong> – Khách hàng: <strong>{activeOrder?.customerName}</strong>
            </p>
            <div className="p-3 bg-light rounded mb-3 small">
              <div className="d-flex justify-content-between mb-1">
                <span>Tiền cọc ban đầu của khách:</span>
                <strong>{activeOrder?.totalDeposit.toLocaleString('vi-VN')} ₫</strong>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Số tiền cọc hoàn trả thực tế (VNĐ) *</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={activeOrder?.totalDeposit}
                value={actualDepositReturned}
                onChange={(e) => setActualDepositReturned(Number(e.target.value))}
                required
              />
              <Form.Text className="text-muted small">
                Nếu đồ nguyên vẹn thì hoàn 100%. Nếu hư hại, khấu trừ và ghi số tiền thực trả.
              </Form.Text>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Ghi chú kiểm tra đồ khi nhận trả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowReturnModal(false)}>
              Hủy
            </Button>
            <Button
              variant="success"
              size="sm"
              disabled={processing}
              onClick={handleConfirmReturn}
            >
              {processing ? <Spinner animation="border" size="sm" /> : 'Xác nhận trả đồ & Hoàn tất'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

