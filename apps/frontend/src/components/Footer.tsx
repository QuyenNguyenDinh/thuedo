import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-4 mt-auto border-top">
      <Container>
        <Row className="gy-4">
          <Col md={4}>
            <h5 className="brand-logo mb-3">
              Cos<span>Rent</span>
            </h5>
            <p className="text-secondary small">
              Hệ thống website cho thuê trang phục và đồ cosplay cao cấp phong cách Booking.com.
              Đặt giữ chỗ trực tuyến, kiểm tra lịch tồn kho tức thì, nhận và trả đồ trực tiếp tại quầy cửa hàng.
            </p>
            <p className="text-secondary small mb-1">
              <i className="bi bi-geo-alt-fill text-warning me-2"></i>
              Địa chỉ: 123 Đường Láng, Đống Đa, Hà Nội
            </p>
            <p className="text-secondary small">
              <i className="bi bi-telephone-fill text-warning me-2"></i>
              Hotline: 0988.888.888 (08:00 - 21:00 hàng ngày)
            </p>
          </Col>

          <Col md={4} sm={6}>
            <h6 className="text-white fw-bold mb-3">Chính sách & Quy định</h6>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-2">
                <i className="bi bi-check2-circle text-success me-2"></i>
                Nhận & trả đồ trực tiếp tại cửa hàng
              </li>
              <li className="mb-2">
                <i className="bi bi-check2-circle text-success me-2"></i>
                Thanh toán tiền thuê và cọc tại quầy
              </li>
              <li className="mb-2">
                <i className="bi bi-check2-circle text-success me-2"></i>
                Hoàn 100% tiền cọc khi trả đồ nguyên vẹn
              </li>
              <li className="mb-2">
                <i className="bi bi-shield-check text-info me-2"></i>
                Bảo vệ dữ liệu cá nhân theo NĐ 13/2023/NĐ-CP
              </li>
              <li>
                <i className="bi bi-info-circle text-warning me-2"></i>
                Minh bạch giá theo Luật BVQLNTD 2023
              </li>
            </ul>
          </Col>

          <Col md={4} sm={6}>
            <h6 className="text-white fw-bold mb-3">Liên kết nhanh</h6>
            <ul className="list-unstyled text-secondary small">
              <li className="mb-2">
                <Link to="/costumes" className="text-secondary text-decoration-none hover-white">
                  Tất cả trang phục cosplay
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/costumes?categoryId=game-cosplay" className="text-secondary text-decoration-none">
                  Game Cosplay (Genshin / Honkai)
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/costumes?categoryId=anime-manga" className="text-secondary text-decoration-none">
                  Anime & Manga (Demon Slayer, Frieren)
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/costumes?categoryId=co-phong-hanfu" className="text-secondary text-decoration-none">
                  Cổ phong & Hán phục
                </Link>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="my-4 border-secondary opacity-25" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary">
          <p className="mb-2 mb-md-0">
            © 2026 CosRent. Dự án Bài tập lớn Môn Phát triển Ứng dụng Web Nâng cao – ĐH Phenikaa.
          </p>
          <p className="mb-0">
            Giấy phép mã nguồn: MIT. Hình ảnh nhân vật thuộc bản quyền tác giả/studio tương ứng.
          </p>
        </div>
      </Container>
    </footer>
  );
};

