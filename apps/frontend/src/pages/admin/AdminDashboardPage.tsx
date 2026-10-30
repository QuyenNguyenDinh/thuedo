import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { OrderStatus } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/admin/dashboard');
      setData(res.data || res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải số liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    }
  }, [isAdmin]);

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

  return (
    <div className="py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">
              <i className="bi bi-speedometer2 text-warning me-2"></i>Bảng Điều Khiển Cửa Hàng
            </h3>
            <p className="text-muted small mb-0">
              Tổng hợp doanh thu dịch vụ, tình trạng kho vận và các đơn thuê cần xử lý
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={fetchDashboard}>
              <i className="bi bi-arrow-clockwise me-1"></i> Làm mới số liệu
            </Button>
            <Link to="/admin/rentals" className="btn btn-primary btn-sm">
              <i className="bi bi-receipt-cutoff me-1"></i> Xử lý đơn thuê
            </Link>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5 bg-white rounded border shadow-sm">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Đang tải số liệu thống kê...</p>
          </div>
        ) : (
          (() => {
            const overview = data?.overview || data || {};
            const statusCounts = data?.statusDistribution || data?.statusCounts || {};
            const totalRevenue = Number(overview.totalRevenue ?? data?.totalRevenue ?? 0);
            const pendingCount = Number(overview.pendingOrdersCount ?? data?.pendingCount ?? 0);
            const activeRentingItems = Number(overview.activeRentingItems ?? data?.activeRentingItems ?? 0);
            const overdueCount = Number(overview.overdueOrdersCount ?? data?.overdueCount ?? 0);

            return (
              <>
                {/* KPI Cards Row */}
            <Row className="g-3 mb-4">
              <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm p-3 bg-white rounded h-100 border-start border-primary border-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted fw-semibold">TỔNG DOANH THU THUÊ</small>
                      <h4 className="fw-extrabold text-primary mb-0 mt-1">
                        {totalRevenue.toLocaleString('vi-VN')} ₫
                      </h4>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        (Không tính tiền cọc hoàn lại)
                      </small>
                    </div>
                    <i className="bi bi-cash-stack fs-1 text-primary opacity-50"></i>
                  </div>
                </Card>
              </Col>

              <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm p-3 bg-white rounded h-100 border-start border-warning border-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted fw-semibold">ĐƠN CHỜ XÁC NHẬN</small>
                      <h4 className="fw-extrabold text-warning mb-0 mt-1">
                        {pendingCount} đơn
                      </h4>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Cần duyệt trước khi khách tới
                      </small>
                    </div>
                    <i className="bi bi-clock-history fs-1 text-warning opacity-50"></i>
                  </div>
                </Card>
              </Col>

              <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm p-3 bg-white rounded h-100 border-start border-info border-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted fw-semibold">ĐỒ ĐANG NGOÀI CỬA HÀNG</small>
                      <h4 className="fw-extrabold text-info mb-0 mt-1">
                        {activeRentingItems} bộ
                      </h4>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Khách đang giữ (Status: RENTING)
                      </small>
                    </div>
                    <i className="bi bi-person-walking fs-1 text-info opacity-50"></i>
                  </div>
                </Card>
              </Col>

              <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm p-3 bg-white rounded h-100 border-start border-danger border-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted fw-semibold">CẢNH BÁO QUÁ HẠN</small>
                      <h4 className="fw-extrabold text-danger mb-0 mt-1">
                        {overdueCount} đơn
                      </h4>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Chưa trả đồ sau ngày hẹn
                      </small>
                    </div>
                    <i className="bi bi-exclamation-triangle-fill fs-1 text-danger opacity-50"></i>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              {/* Recent Pending Orders */}
              <Col lg={7}>
                <Card className="border-0 shadow-sm p-4 bg-white rounded h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Đơn Chờ Duyệt Gấp (Top 5 PENDING)</h5>
                    <Link to="/admin/rentals?status=PENDING" className="small text-decoration-none">
                      Xem tất cả &rarr;
                    </Link>
                  </div>

                  {data?.recentPendingOrders && data.recentPendingOrders.length > 0 ? (
                    <Table responsive hover className="align-middle mb-0">
                      <thead className="table-light small text-muted text-uppercase">
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách hàng</th>
                          <th>Ngày nhận</th>
                          <th>Tổng tiền</th>
                          <th className="text-end">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentPendingOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td className="fw-bold">{o.orderCode}</td>
                            <td>
                              <div>{o.customerName}</div>
                              <small className="text-muted">{o.customerPhone}</small>
                            </td>
                            <td>{o.startDate}</td>
                            <td className="fw-bold text-danger">
                              {(o.totalRentalFee + o.totalDeposit).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="text-end">
                              <Link
                                to={`/admin/rentals?keyword=${o.orderCode}`}
                                className="btn btn-warning btn-sm fw-bold"
                              >
                                Xử lý
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted small text-center py-4 mb-0">
                      Hiện không có đơn nào ở trạng thái chờ duyệt.
                    </p>
                  )}
                </Card>
              </Col>

              {/* Top Costumes & Status Distribution */}
              <Col lg={5}>
                <Card className="border-0 shadow-sm p-4 bg-white rounded h-100">
                  <h5 className="fw-bold mb-3">Trang Phục Thuê Nhiều Nhất</h5>
                  {data?.topCostumes && data.topCostumes.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mb-4">
                      {data.topCostumes.map((tc: any, idx: number) => (
                        <div
                          key={tc.name}
                          className="d-flex justify-content-between align-items-center p-2 rounded bg-light"
                        >
                          <div className="d-flex align-items-center">
                            <span className="badge bg-primary rounded-circle me-2" style={{ width: '24px' }}>
                              {idx + 1}
                            </span>
                            <span className="fw-semibold small text-truncate" style={{ maxWidth: '240px' }}>
                              {tc.name}
                            </span>
                          </div>
                          <Badge bg="success">{tc.rentedCount} lượt thuê</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-3">Chưa có đủ dữ liệu thống kê sản phẩm.</p>
                  )}

                  <hr />

                  <h6 className="fw-bold mb-2 small text-muted text-uppercase">Phân bổ trạng thái đơn</h6>
                  <div className="d-flex flex-wrap gap-2 small">
                    <span className="badge bg-warning text-dark p-2">
                      Pending: {statusCounts[OrderStatus.PENDING] || 0}
                    </span>
                    <span className="badge bg-info text-dark p-2">
                      Confirmed: {statusCounts[OrderStatus.CONFIRMED] || 0}
                    </span>
                    <span className="badge bg-primary p-2">
                      Renting: {statusCounts[OrderStatus.RENTING] || 0}
                    </span>
                    <span className="badge bg-success p-2">
                      Returned: {statusCounts[OrderStatus.RETURNED] || 0}
                    </span>
                    <span className="badge bg-secondary p-2">
                      Cancelled: {statusCounts[OrderStatus.CANCELLED] || 0}
                    </span>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
            );
          })()
        )}
      </Container>
    </div>
  );
};

