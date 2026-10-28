import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, Category } from '../types';
import { SearchBar } from '../components/SearchBar';
import { CostumeCard } from '../components/CostumeCard';

export const HomePage: React.FC = () => {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costumesRes, categoriesRes]: any = await Promise.all([
          api.get('/costumes?limit=8'),
          api.get('/categories'),
        ]);
        setCostumes(costumesRes.data?.items || costumesRes.items || []);
        setCategories(categoriesRes.data || categoriesRes || []);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang chủ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section Booking.com Style */}
      <section className="header-navy text-white pt-5 pb-5 position-relative">
        <Container>
          <Row className="justify-content-center text-center mb-4">
            <Col lg={9}>
              <h1 className="fw-extrabold display-5 mb-3">
                Thuê Trang Phục & Phụ Kiện Cosplay Cao Cấp
              </h1>
              <p className="lead text-light opacity-90 mb-4">
                Khám phá hàng trăm bộ trang phục Anime, Game Genshin, Cổ phong với giá chỉ từ{' '}
                <strong className="text-warning">120.000 ₫/ngày</strong>. Nhận và trả đồ trực tiếp tại cửa hàng!
              </p>
            </Col>
          </Row>

          {/* Prominent Search Box */}
          <Row className="justify-content-center">
            <Col lg={11}>
              <SearchBar />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Categories */}
      <section className="py-5 bg-white border-bottom">
        <Container>
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h4 className="fw-bold mb-1">Khám Phá Theo Danh Mục</h4>
              <p className="text-muted small mb-0">Tìm nhanh trang phục theo thế giới bạn muốn hóa thân</p>
            </div>
            <Link to="/costumes" className="btn btn-outline-primary btn-sm fw-semibold">
              Xem tất cả <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          <Row className="g-3">
            {categories.map((cat) => (
              <Col md={4} sm={6} key={cat.id}>
                <Card
                  as={Link}
                  to={`/costumes?categoryId=${cat.id}`}
                  className="h-100 p-3 border text-decoration-none text-dark shadow-sm hover-shadow transition"
                  style={{ borderRadius: '8px' }}
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                      style={{ width: '48px', height: '48px' }}
                    >
                      <i className="bi bi-tag-fill text-warning fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-primary">{cat.name}</h6>
                      <small className="text-muted text-truncate d-block" style={{ maxWidth: '220px' }}>
                        {cat.description || 'Xem danh sách trang phục'}
                      </small>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Costumes Section */}
      <section className="py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h4 className="fw-bold mb-1">Trang Phục Nổi Bật Được Thuê Nhiều Nhất</h4>
              <p className="text-muted small mb-0">Luôn giặt là thơm tho, kiểm tra phụ kiện kỹ càng trước khi bàn giao</p>
            </div>
            <Link to="/costumes" className="btn btn-primary fw-semibold">
              Xem toàn bộ kho đồ ({costumes.length}+)
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Đang tải kho trang phục CosRent...</p>
            </div>
          ) : (
            <Row className="g-4">
              {costumes.map((costume) => (
                <Col lg={3} md={4} sm={6} key={costume.id}>
                  <CostumeCard costume={costume} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Service Guarantees Section */}
      <section className="py-5 bg-white border-top">
        <Container>
          <Row className="g-4 text-center">
            <Col md={3} sm={6}>
              <div className="p-3">
                <i className="bi bi-shop fs-1 text-primary mb-3 d-block"></i>
                <h6 className="fw-bold">Nhận Trả Tại Quầy</h6>
                <small className="text-muted">
                  Thử đồ trực tiếp tại cửa hàng, kiểm tra phụ kiện kỹ càng trước khi mang về.
                </small>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="p-3">
                <i className="bi bi-shield-check fs-1 text-success mb-3 d-block"></i>
                <h6 className="fw-bold">Cọc Minh Bạch</h6>
                <small className="text-muted">
                  Tách riêng tiền thuê và tiền cọc; hoàn trả 100% cọc ngay khi nhận lại đồ nguyên vẹn.
                </small>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="p-3">
                <i className="bi bi-stars fs-1 text-warning mb-3 d-block"></i>
                <h6 className="fw-bold">Phụ Kiện Đầy Đủ</h6>
                <small className="text-muted">
                  Tóc giả chải mượt tạo kiểu sẵn, vũ khí và đạo cụ mô phỏng an toàn, sắc nét.
                </small>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="p-3">
                <i className="bi bi-calendar4-week fs-1 text-info mb-3 d-block"></i>
                <h6 className="fw-bold">Tồn Kho Thời Gian Thực</h6>
                <small className="text-muted">
                  Hệ thống kiểm tra lịch tự động từng ngày, cam kết không bị trùng lịch thuê.
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

