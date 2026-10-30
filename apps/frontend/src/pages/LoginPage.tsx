import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect (vd: ?redirect=//evil.com)
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectUrl =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <Card className="border-0 shadow-sm p-4 bg-white rounded">
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-1">
                Đăng nhập Cos<span>Rent</span>
              </h3>
              <p className="text-muted small">
                Chào mừng bạn quay trở lại với kho cosplay
              </p>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="small fw-semibold">Địa chỉ Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label className="small fw-semibold">Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="warning"
                type="submit"
                className="btn-search-gold w-100 fw-bold py-2 mb-3"
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Đăng nhập'}
              </Button>

              <div className="p-2 bg-light rounded text-center small text-muted mb-3">
                <span className="fw-bold d-block mb-1">Tài khoản demo thử nghiệm:</span>
                Admin: <code>admin@cosrent.com</code> / <code>Admin123@</code><br />
                Khách: <code>customer@cosrent.com</code> / <code>Customer123@</code>
              </div>

              <div className="text-center small text-muted">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary fw-semibold">
                  Đăng ký ngay
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </Container>
  );
};
