import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Accordion, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, Category } from '../types';
import { SearchBar } from '../components/SearchBar';
import { CostumeCard } from '../components/CostumeCard';

interface HeroSlide {
  id: string;
  badgeIcon: string;
  badgeText: string;
  title: string;
  highlightText: string;
  description: string;
  perks: string[];
  ctaLink: string;
  ctaText: string;
  ctaIcon: string;
  secondaryLink?: string;
  secondaryText?: string;
  bgImage: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'vay-chup-anh',
    badgeIcon: 'bi-stars',
    badgeText: 'Bộ Sưu Tập Nàng Thơ & Dạ Hội 2026',
    title: 'Váy Nàng Thơ, Dạ Hội Prom & Vintage Kỷ Yếu',
    highlightText: 'Thuê 3 ngày tính tiền 2 ngày',
    description:
      'Tuyển tập váy công chúa bồng xòe, đầm dạ hội sang trọng và váy vintage chụp ngoại cảnh. Tặng kèm vương miện, găng tay ren và phụ kiện chụp ảnh xinh xắn.',
    perks: ['Đầy đủ phụ kiện vương miện', 'Giặt hấp thơm tho chuẩn tiệm', 'Đổi size miễn phí trong 24h'],
    ctaLink: '/costumes?categoryId=vay-chup-anh',
    ctaText: 'Khám Phá Váy Nàng Thơ',
    ctaIcon: 'bi-bag-heart-fill',
    secondaryLink: '/costumes',
    secondaryText: 'Xem Tất Cả Đồ',
    bgImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'trang-phuc-dan-toc',
    badgeIcon: 'bi-gem',
    badgeText: 'Bản Sắc Việt & Du Lịch Ngoại Cảnh',
    title: 'Đồ Dân Tộc Tây Bắc & Cổ Phục Nhật Bình Hoàng Triều',
    highlightText: 'Ưu đãi giảm 20% cho nhóm từ 3 bộ',
    description:
      'Trang phục H\'Mông Sapa, Thái Mộc Châu, Cổ phục Việt Nhật Bình, Áo Tấc & Áo dài ngũ thân. Kèm kiềng bạc, nón lá, hài thêu và ô che thổ cẩm.',
    perks: ['Kèm kiềng bạc & ô thổ cẩm', 'Chất vải dệt hoa văn tinh xảo', 'Hỗ trợ gói chụp ảnh kỷ yếu'],
    ctaLink: '/costumes?categoryId=trang-phuc-dan-toc',
    ctaText: 'Xem Đồ Dân Tộc & Cổ Phục',
    ctaIcon: 'bi-camera-fill',
    secondaryLink: '/costumes?keyword=Nhật+Bình',
    secondaryText: 'Cổ Phục Nhật Bình',
    bgImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'game-cosplay',
    badgeIcon: 'bi-controller',
    badgeText: 'Đại Tiệc Cosplay Festival 2026',
    title: 'Raiden Shogun, Furina, Frieren & Siêu Anh Hùng',
    highlightText: 'Full Set Wig Tạo Kiểu + Prop Vũ Khí',
    description:
      'Kho đồ Genshin Impact, Honkai Star Rail, Kimetsu no Yaiba, Spider-Man... Tóc giả wig đã được vuốt keo giữ form sẵn, giáp phụ kiện sắc nét từng chi tiết.',
    perks: ['Wig vuốt keo form chuẩn', 'Giáp & prop vũ khí tinh xảo', 'Thanh toán VietQR quét mã tức thì'],
    ctaLink: '/costumes?categoryId=game-cosplay',
    ctaText: 'Thuê Đồ Cosplay Ngay',
    ctaIcon: 'bi-lightning-charge-fill',
    secondaryLink: '/costumes?keyword=Raiden',
    secondaryText: 'Raiden Shogun',
    bgImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'do-di-choi-concept',
    badgeIcon: 'bi-sun-fill',
    badgeText: 'Check-in Dã Ngoại & Đi Biển',
    title: 'Bohemian Dã Ngoại, Maxi Đi Biển & Outfit Sống Ảo',
    highlightText: 'Giá thuê chỉ từ 120.000 ₫/ngày',
    description:
      'Set đồ phong cách Boho du mục, đầm maxi đi biển sống ảo bãi biển Phú Quốc, Đà Nẵng, đồi chè camping dã ngoại cuối tuần lung linh cùng nhóm bạn.',
    perks: ['Phù hợp du lịch & camping', 'Phom dáng thoải mái tôn da', 'Thử đồ trực tiếp tại shop'],
    ctaLink: '/costumes?categoryId=do-di-choi-concept',
    ctaText: 'Xem Đồ Du Lịch & Dã Ngoại',
    ctaIcon: 'bi-compass-fill',
    secondaryLink: '/costumes',
    secondaryText: 'Bảng Giá Thuê',
    bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
  },
];

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
  'vay-chup-anh': {
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-camera-reels-fill',
    iconColor: '#e83e8c',
    tag: 'Nàng thơ & Prom',
    subtitle: 'Váy dạ hội, vintage kỷ yếu & concept ngoại cảnh',
  },
  'trang-phuc-dan-toc': {
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-gem',
    iconColor: '#198754',
    tag: 'Bản sắc',
    subtitle: 'Đồ H\'Mông, Thái, Cổ phục Việt Nhật Bình & Áo dài',
  },
  'do-di-choi-concept': {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-sun-fill',
    iconColor: '#fd7e14',
    tag: 'Du lịch',
    subtitle: 'Bohemian dã ngoại, Y2K & trang phục chụp ảnh nhóm',
  },
  'co-phong-hanfu': {
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-flower1',
    iconColor: '#20c997',
    tag: 'Thanh lịch',
    subtitle: 'Ma Đạo Tổ Sư, Hán phục Minh Chế, Tiên hiệp',
  },
  'sieu-anh-hung': {
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=600&auto=format&fit=crop&q=80',
    icon: 'bi-shield-shaded',
    iconColor: '#6f42c1',
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
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [resetTimerKey, setResetTimerKey] = useState<number>(0);

  // Auto transition every 5 seconds (5000ms) if user doesn't manually click
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [resetTimerKey]);

  const handleSelect = (selectedIndex: number) => {
    setActiveIndex(selectedIndex);
    // Reset countdown so user gets a full 5 seconds on the chosen slide
    setResetTimerKey(Date.now());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costumesRes, categoriesRes]: any = await Promise.all([
          api.get('/costumes?limit=12'),
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
      {/* Animated Hero Carousel Banner */}
      <section className="hero-carousel-section">
        <Carousel
          fade
          activeIndex={activeIndex}
          onSelect={handleSelect}
          interval={null}
          pause={false}
          className="hero-carousel"
          prevIcon={
            <div className="hero-carousel-ctrl-btn" title="Slide trước">
              <i className="bi bi-chevron-left"></i>
            </div>
          }
          nextIcon={
            <div className="hero-carousel-ctrl-btn" title="Slide tiếp">
              <i className="bi bi-chevron-right"></i>
            </div>
          }
        >
          {HERO_SLIDES.map((slide) => (
            <Carousel.Item key={slide.id}>
              <div className="hero-carousel-item">
                <div
                  className="hero-carousel-bg"
                  style={{ backgroundImage: `url("${slide.bgImage}")` }}
                />
                <div className="hero-carousel-overlay" />

                <div className="hero-carousel-content">
                  <div className="hero-carousel-badge">
                    <i className={`bi ${slide.badgeIcon}`}></i>
                    <span>{slide.badgeText}</span>
                  </div>

                  <h1 className="hero-carousel-title">{slide.title}</h1>

                  <p className="hero-carousel-desc">
                    {slide.description}{' '}
                    <strong className="text-warning fw-bold d-inline-block">
                      ★ {slide.highlightText}
                    </strong>
                  </p>

                  <div className="hero-carousel-perks">
                    {slide.perks.map((perk, i) => (
                      <span key={i} className="hero-carousel-perk">
                        <i className="bi bi-check2-circle text-warning"></i>
                        <span>{perk}</span>
                      </span>
                    ))}
                  </div>

                  <div className="hero-carousel-actions">
                    <Link to={slide.ctaLink} className="hero-carousel-btn-primary">
                      <i className={`bi ${slide.ctaIcon}`}></i>
                      <span>{slide.ctaText}</span>
                    </Link>
                    {slide.secondaryLink && (
                      <Link to={slide.secondaryLink} className="hero-carousel-btn-secondary">
                        <span>{slide.secondaryText}</span>
                        <i className="bi bi-arrow-right"></i>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Floating Search Bar (Booking.com style) */}
        <Container className="hero-search-wrapper">
          <Row className="justify-content-center">
            <Col lg={11}>
              <SearchBar />

              {/* Quick Filter Pills Booking Style */}
              <div className="quick-filter-pills justify-content-center">
                <span className="text-light small align-self-center me-1 opacity-75">Gợi ý nhanh:</span>
                <Link to="/costumes?keyword=Raiden" className="quick-filter-pill">
                  ⚡ Raiden Shogun
                </Link>
                <Link to="/costumes?categoryId=vay-chup-anh" className="quick-filter-pill">
                  👗 Váy Nàng Thơ & Dạ Hội
                </Link>
                <Link to="/costumes?categoryId=trang-phuc-dan-toc" className="quick-filter-pill">
                  🏔️ Đồ Dân Tộc & Cổ Phục
                </Link>
                <Link to="/costumes?categoryId=do-di-choi-concept" className="quick-filter-pill">
                  🌾 Bohemian Đi Chơi
                </Link>
                <Link to="/costumes?maxPrice=160000" className="quick-filter-pill">
                  💰 Giá mềm dưới 160.000 ₫
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Categories */}
      <section className="py-5 bg-white border-bottom">
        <Container>
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h4 className="fw-bold mb-1 text-dark">Khám Phá Theo Danh Mục</h4>
              <p className="text-muted small mb-0">Cosplay, Váy chụp ảnh, Đồ dân tộc Tây Bắc và Concept dã ngoại</p>
            </div>
            <Link to="/costumes" className="btn btn-outline-primary btn-sm fw-semibold">
              Xem tất cả <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.slug] || {
                image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
                icon: 'bi-tag-fill',
                iconColor: '#003580',
                tag: 'Thời trang',
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
                        <span>Xem trang phục ({cat.costumeCount ?? 'nhiều'})</span>
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
              <h4 className="fw-bold mb-1 text-dark">Trang Phục Nổi Bật Được Thuê Nhiều Nhất</h4>
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

      {/* Why Choose CosRent - Trust proposition */}
      <section className="py-5 bg-white border-top border-bottom">
        <Container>
          <div className="text-center mb-5">
            <h4 className="fw-bold text-dark mb-2">Tại Sao Nên Thuê Trang Phục Tại CosRent?</h4>
            <p className="text-muted small">Cam kết trải nghiệm chuẩn dịch vụ cao cấp, an tâm tuyệt đối</p>
          </div>

          <Row className="g-4">
            <Col md={3} sm={6}>
              <div className="trust-card">
                <div className="trust-icon">
                  <i className="bi bi-magic"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Đa Dạng Phong Cách</h6>
                <p className="text-muted small mb-0">
                  Từ Cosplay Anime, Váy dạ hội nàng thơ, Đồ dân tộc Tây Bắc đến Cổ phục Việt và trang phục dã ngoại.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="trust-card">
                <div className="trust-icon">
                  <i className="bi bi-qr-code-scan"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Thanh Toán VietQR Tức Thì</h6>
                <p className="text-muted small mb-0">
                  Hỗ trợ quét mã QR ngân hàng tự động, thanh toán tiền thuê hoặc cọc nhanh chóng, an toàn bảo mật.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="trust-card">
                <div className="trust-icon">
                  <i className="bi bi-shop"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Thử Đồ Trực Tiếp Tại Quầy</h6>
                <p className="text-muted small mb-0">
                  Phòng thử đồ riêng tư có gương lớn và đèn trợ sáng. Hỗ trợ đổi size ngay tại chỗ nếu kho còn hàng.
                </p>
              </div>
            </Col>

            <Col md={3} sm={6}>
              <div className="trust-card">
                <div className="trust-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Cọc Minh Bạch & Hoàn 100%</h6>
                <p className="text-muted small mb-0">
                  Tách riêng tiền thuê và tiền cọc rõ ràng. Hoàn trả tiền cọc ngay lập tức khi bạn trả lại trang phục.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Accordion Section on Homepage */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark mb-2">Giải Đáp Thắc Mắc Cho Khách Thuê Lần Đầu</h4>
            <p className="text-muted small">Những điều bạn cần biết trước khi đến nhận đồ tại quầy CosRent</p>
          </div>

          <Row className="justify-content-center">
            <Col lg={9}>
              <div className="bg-white p-4 rounded border shadow-sm">
                <Accordion defaultActiveKey="0" flush>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>1. Shop có cho thuê váy chụp ảnh kỷ yếu và đồ dân tộc đi du lịch không?</Accordion.Header>
                    <Accordion.Body className="small text-muted">
                      Có! Ngoài cosplay, CosRent có bộ sưu tập váy dạ hội, vintage nàng thơ, trang phục dân tộc H'Mông, Thái, Cổ phục Việt và đồ du lịch dã ngoại kèm đầy đủ phụ kiện mũ nón, hoa cài, kiềng bạc.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>2. Tôi có thể thanh toán trước bằng chuyển khoản VietQR không?</Accordion.Header>
                    <Accordion.Body className="small text-muted">
                      Có! Ngay tại bước đặt đơn, hệ thống hỗ trợ quét mã VietQR tự động để thanh toán tiền thuê hoặc đặt cọc giữ đồ trước. Bạn cũng có thể chọn hình thức trả trực tiếp tại quầy lúc đến thử đồ.
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>3. Ngày nhận đồ và ngày trả đồ được tính tiền như thế nào?</Accordion.Header>
                    <Accordion.Body className="small text-muted">
                      Hệ thống CosRent tính tiền theo ngày lịch trọn vẹn (bao gồm cả ngày nhận và ngày trả) theo giờ Việt Nam. Ví dụ: Thuê nhận Thứ 7 và trả Chủ Nhật = 2 ngày thuê.
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};
