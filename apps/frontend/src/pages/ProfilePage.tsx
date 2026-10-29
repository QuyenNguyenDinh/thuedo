import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({ fullName, phone, address });
      setSuccess('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm p-4 bg-white rounded">
            <h4 className="fw-bold mb-3">
              <i className="bi bi-person-badge text-warning me-2"></i>Hồ Sơ Cá Nhân
            </h4>
            <p className="text-muted small mb-4">
              Quản lý thông tin liên hệ chính xác để cửa hàng bàn giao trang phục tại quầy
            </p>

            {success && <Alert variant="success" className="py-2 small">{success}</Alert>}
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Địa chỉ Email (Cố định)</Form.Label>
                <Form.Control type="email" value={user.email} disabled className="bg-light" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Vai trò tài khoản</Form.Label>
                <div>
                  <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'} px-3 py-2`}>
                    {user.role}
                  </span>
                </div>
              </Form.Group>

              <hr className="my-4" />

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Họ và tên *</Form.Label>
                <Form.Control
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Số điện thoại liên hệ *</Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold">Địa chỉ liên hệ</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, quận, thành phố"
                />
              </Form.Group>

              <Button variant="primary" type="submit" disabled={saving} className="fw-semibold px-4 py-2">
                {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Lưu thay đổi hồ sơ
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

