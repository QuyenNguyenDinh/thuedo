import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Spinner, Alert, Pagination, Badge } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Costume, Category } from '../types';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { CostumeCard } from '../components/CostumeCard';
import { getWishlist } from '../services/wishlist';

export const CostumeListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & meta
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // Filter states from URL
  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const size = searchParams.get('size') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt_desc';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const savedOnly = searchParams.get('saved') === 'true';

  // Load categories
  useEffect(() => {
    api.get('/categories')
      .then((res: any) => setCategories(res.data || res || []))
      .catch((err) => console.error('Lỗi tải danh mục:', err));
  }, []);

  // Fetch costumes whenever searchParams change
  useEffect(() => {
    const fetchCostumes = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (keyword) params.set('keyword', keyword);
        if (categoryId) params.set('categoryId', categoryId);
        if (size) params.set('size', size);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (sortBy) params.set('sortBy', sortBy);

        // If saved only, request more items to filter locally
        if (savedOnly) {
          params.set('limit', '50');
        } else {
          params.set('page', String(page));
          params.set('limit', '12');
        }

        const res: any = await api.get(`/costumes?${params.toString()}`);
        const data = res.data || res;
        let items: Costume[] = data.items || [];

        if (savedOnly) {
          const wishlist = getWishlist();
          items = items.filter((item) => wishlist.includes(item.id));
          setCostumes(items);
          setTotal(items.length);
          setTotalPages(1);
        } else {
          setCostumes(items);
          setTotal(data.meta?.total || 0);
          setTotalPages(data.meta?.totalPages || 1);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách trang phục.');
      } finally {
        setLoading(false);
      }
    };

    fetchCostumes();
  }, [searchParams, page, savedOnly]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setPage(1);
    setSearchParams(next);
  };

  const handlePriceChange = (min: string, max: string) => {
    const next = new URLSearchParams(searchParams);
    if (min) next.set('minPrice', min);
    else next.delete('minPrice');
    if (max) next.set('maxPrice', max);
    else next.delete('maxPrice');
    next.set('page', '1');
    setPage(1);
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (startDate) next.set('startDate', startDate);
    if (endDate) next.set('endDate', endDate);
    setPage(1);
    setSearchParams(next);
  };

  return (
    <div className="py-4">
      <Container>
        {/* Compact search bar on top */}
        <div className="mb-4">
          <SearchBar
            initialKeyword={keyword}
            initialStartDate={startDate}
            initialEndDate={endDate}
            compact
          />
        </div>

        <Row className="g-4">
          {/* Left Column: Filter Sidebar */}
          <Col lg={3} md={4}>
            <FilterSidebar
              categories={categories}
              selectedCategory={categoryId}
              onSelectCategory={(id) => updateParam('categoryId', id)}
              selectedSize={size}
              onSelectSize={(s) => updateParam('size', s)}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
              onReset={handleResetFilters}
            />
          </Col>

          {/* Right Column: Costumes Catalog */}
          <Col lg={9} md={8}>
            <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded border shadow-sm">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold mb-0">
                    {savedOnly ? 'Trang phục đã lưu yêu thích' : 'Kết quả tìm kiếm'}
                  </h5>
                  {savedOnly && (
                    <Badge bg="danger" className="rounded-pill">
                      Yêu thích
                    </Badge>
                  )}
                </div>
                <small className="text-muted">
                  Tìm thấy <strong>{total}</strong> trang phục phù hợp
                </small>
              </div>

              <div className="d-flex align-items-center gap-2">
                {savedOnly && (
                  <Link to="/costumes" className="btn btn-outline-secondary btn-sm me-2">
                    Xem tất cả trang phục
                  </Link>
                )}
                <small className="text-muted text-nowrap">Sắp xếp:</small>
                <Form.Select
                  size="sm"
                  value={sortBy}
                  onChange={(e) => updateParam('sortBy', e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="createdAt_desc">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </Form.Select>
              </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
              <div className="text-center py-5 bg-white rounded border shadow-sm">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Đang tìm kiếm trang phục...</p>
              </div>
            ) : costumes.length === 0 ? (
              <div className="text-center py-5 bg-white rounded border shadow-sm p-4">
                <i className="bi bi-emoji-neutral fs-1 text-muted d-block mb-2"></i>
                <h5 className="fw-bold">
                  {savedOnly
                    ? 'Bạn chưa lưu trang phục nào vào danh sách yêu thích'
                    : 'Không tìm thấy trang phục phù hợp'}
                </h5>
                <p className="text-muted small">
                  {savedOnly
                    ? 'Hãy bấm vào biểu tượng trái tim trên các thẻ trang phục để lưu lại khi xem.'
                    : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc mở rộng khoảng giá và kích cỡ.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleResetFilters}
                >
                  {savedOnly ? 'Khám phá trang phục ngay' : 'Xóa toàn bộ bộ lọc'}
                </button>
              </div>
            ) : (
              <>
                <Row className="g-3">
                  {costumes.map((costume) => (
                    <Col lg={4} md={6} sm={6} key={costume.id}>
                      <CostumeCard
                        costume={costume}
                        searchDates={{ startDate, endDate }}
                      />
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {!savedOnly && totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.Prev
                        disabled={page <= 1}
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Pagination.Item
                          key={p}
                          active={p === page}
                          onClick={() => {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {p}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={page >= totalPages}
                        onClick={() => {
                          setPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};
