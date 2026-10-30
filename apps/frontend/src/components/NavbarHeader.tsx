import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWishlist } from '../services/wishlist';

export const NavbarHeader: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [wishlistCount, setWishlistCount] = useState<number>(() => getWishlist().length);

  useEffect(() => {
    const handleWishlistChange = () => {
      setWishlistCount(getWishlist().length);
    };
    window.addEventListener('cosrent_wishlist_change', handleWishlistChange);
    return () => {
      window.removeEventListener('cosrent_wishlist_change', handleWishlistChange);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar expand="lg" className="header-navy py-2 shadow-sm" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-logo">
          Cos<span>Rent</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" />

        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto ms-lg-4">
            <Nav.Link as={Link} to="/costumes" className="text-white fw-semibold">
              <i className="bi bi-grid-fill me-1 text-warning"></i> Danh sách trang phục
            </Nav.Link>
            <Nav.Link as={Link} to="/costumes?saved=true" className="text-white fw-semibold">
              <i className="bi bi-heart-fill me-1 text-danger"></i> Đã lưu
              {wishlistCount > 0 && (
                <span className="badge rounded-pill bg-warning text-dark ms-1" style={{ fontSize: '0.72rem' }}>
                  {wishlistCount}
                </span>
              )}
            </Nav.Link>
            {user && !isAdmin && (
              <Nav.Link as={Link} to="/my-rentals" className="text-white fw-semibold">
                <i className="bi bi-box2-heart-fill me-1 text-warning"></i> Đơn thuê của tôi
              </Nav.Link>
            )}
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard" className="text-warning fw-bold">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/rentals" className="text-white fw-semibold">
                  <i className="bi bi-receipt-cutoff me-1"></i> Quản lý đơn thuê
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/costumes" className="text-white fw-semibold">
                  <i className="bi bi-tags-fill me-1"></i> Quản lý trang phục
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/categories" className="text-white fw-semibold">
                  <i className="bi bi-folder2-open me-1"></i> Quản lý danh mục
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="align-items-center">
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  id="dropdown-user"
                  className="d-flex align-items-center rounded-pill px-3 py-1 border-light"
                >
                  <i className="bi bi-person-circle fs-5 me-2 text-warning"></i>
                  <span className="fw-semibold">{user.fullName}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-lg border-0 py-2">
                  <div className="px-3 py-2 border-bottom">
                    <p className="mb-0 fw-bold">{user.fullName}</p>
                    <small className="text-muted">{user.email}</small>
                    <div className="mt-1">
                      <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-primary'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <Dropdown.Item as={Link} to="/profile" className="py-2">
                    <i className="bi bi-person-lines-fill me-2 text-secondary"></i> Hồ sơ cá nhân
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/costumes?saved=true" className="py-2">
                    <i className="bi bi-heart me-2 text-danger"></i> Trang phục đã lưu ({wishlistCount})
                  </Dropdown.Item>
                  {!isAdmin && (
                    <Dropdown.Item as={Link} to="/my-rentals" className="py-2">
                      <i className="bi bi-bag-check me-2 text-secondary"></i> Lịch sử đơn thuê
                    </Dropdown.Item>
                  )}
                  {isAdmin && (
                    <Dropdown.Item as={Link} to="/admin/dashboard" className="py-2 text-primary fw-semibold">
                      <i className="bi bi-gear-wide-connected me-2"></i> Trang quản trị
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="py-2 text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Link
                  to="/login"
                  className="btn btn-outline-light fw-semibold px-3 py-1"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn btn-search-gold px-3 py-1"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
