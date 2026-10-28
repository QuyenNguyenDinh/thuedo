import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, Category } from '../types';
import { SearchBar } from '../components/SearchBar';
import { CostumeCard } from '../components/CostumeCard';

const CATEGORY_META: Record<
  string,
  {
    image: string;
    icon: string;
    iconColor: string;
    tag: string;
    subtitle: string;
  }
> = {
  'anime-manga': {
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-stars',
    iconColor: '#dc3545',
    tag: 'Thịnh hành',
    subtitle: 'Demon Slayer, SPY x FAMILY, Frieren',
  },
  'game-cosplay': {
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-controller',
    iconColor: '#0d6efd',
    tag: 'Hot nhất',
    subtitle: 'Genshin Impact, Honkai Star Rail, LOL',
  },
  'co-phong-hanfu': {
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-flower1',
    iconColor: '#198754',
    tag: 'Thanh lịch',
    subtitle: 'Ma Đạo Tổ Sư, Hán phục Minh Chế, Tiên hiệp',
  },
  'sieu-anh-hung': {
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-shield-shaded',
    iconColor: '#fd7e14',
    tag: 'Năng động',
    subtitle: 'Spider-Man, Deadpool, Batman, Avengers',
  },
  'vocaloid-idol': {
    image: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-music-note-beamed',
    iconColor: '#0dcaf0',
    tag: 'Sôi động',
    subtitle: 'Hatsune Miku, Oshi no Ko, Love Live',
  },
};

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
      <section
        className="header-navy text-white pt-5 pb-5 position-relative shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 34, 79, 0.94) 0%, rgba(0, 53, 128, 0.90) 100%), url("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80") center/cover no-repeat',
        }}
      >
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

          <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-3">
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.slug] || {
                image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
                icon: 'bi-tag-fill',
                iconColor: '#003580',
                tag: 'Cosplay',
                subtitle: cat.description || 'Xem kho trang phục',
              };

              return (
                <Col key={cat.id}>
                  <Link
                    to={`/costumes?categoryId=${cat.id}`}
                    className="category-card shadow-sm"
                  >
                    <div className="category-card-img-wrapper">
                      <img
                        src={meta.image}
                        alt={cat.name}
                        className="category-card-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
                        }}
                      />
                      <span className="category-card-badge">{meta.tag}</span>
                      <div className="category-card-icon-pill" style={{ color: meta.iconColor }}>
                        <i className={`bi ${meta.icon}`}></i>
                      </div>
                    </div>
                    <div className="category-card-body">
                      <h6 className="fw-bold mb-1 text-dark text-truncate" title={cat.name}>
                        {cat.name}
                      </h6>
                      <small className="text-muted d-block text-truncate mb-2" style={{ fontSize: '0.78rem' }} title={meta.subtitle}>
                        {meta.subtitle}
                      </small>
                      <div className="mt-auto d-flex align-items-center text-primary fw-semibold" style={{ fontSize: '0.8rem' }}>
                        <span>Xem trang phục</span>
                        <i className="bi bi-chevron-right ms-1" style={{ fontSize: '0.7rem' }}></i>
                      </div>
                    </div>
                  </Link>
                </Col>
              );
            })}
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

