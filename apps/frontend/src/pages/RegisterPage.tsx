import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName,
        email,
        phone,
        password,
        address: address || undefined,
      });
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng sang trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <Card className="border-0 shadow-sm p-4 bg-white rounded">
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-1">
                Tạo tài khoản Cos<span>Rent</span>
              </h3>
              <p className="text-muted small">
                Đăng ký để đặt thuê trang phục cosplay nhanh chóng tại cửa hàng
              </p>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            {success && <Alert variant="success" className="py-2 small">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="regFullName">
                <Form.Label className="small fw-semibold">Họ và tên *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="regEmail">
                <Form.Label className="small fw-semibold">Địa chỉ Email *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="regPhone">
                <Form.Label className="small fw-semibold">Số điện thoại liên hệ *</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Form.Text className="text-muted small">
                  Dùng để liên hệ nhận đồ tại quầy
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="regAddress">
                <Form.Label className="small fw-semibold">Địa chỉ (Tùy chọn)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Quận / Thành phố"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="regPassword">
                <Form.Label className="small fw-semibold">Mật khẩu *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Tối thiểu 8 ký tự, có hoa, thường, số"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="regConfirmPassword">
                <Form.Label className="small fw-semibold">Xác nhận mật khẩu *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  label={
                    <span className="small text-muted">
                      Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân theo NĐ 13/2023/NĐ-CP.
                    </span>
                  }
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 fw-bold py-2 mb-3"
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Đăng ký tài khoản'}
              </Button>

              <div className="text-center small text-muted">
                Bạn đã có tài khoản?{' '}
                <Link to="/login" className="text-primary fw-semibold">
                  Đăng nhập tại đây
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </Container>
  );
};
