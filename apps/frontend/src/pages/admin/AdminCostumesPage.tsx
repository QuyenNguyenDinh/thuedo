import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Modal,
  Row,
  Col,
} from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Costume, Category, CostumeVariant } from '../../types';

export const AdminCostumesPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search keyword & category filter
  const [keyword, setKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Add / Edit Costume Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [characterName, setCharacterName] = useState<string>('');
  const [seriesName, setSeriesName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dailyPrice, setDailyPrice] = useState<number>(150000);
  const [depositAmount, setDepositAmount] = useState<number>(500000);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Stock edit modal
  const [showStockModal, setShowStockModal] = useState<boolean>(false);
  const [selectedVariant, setSelectedVariant] = useState<CostumeVariant | null>(null);
  const [totalQuantity, setTotalQuantity] = useState<number>(1);
  const [outOfServiceQuantity, setOutOfServiceQuantity] = useState<number>(0);
  const [stockSaving, setStockSaving] = useState<boolean>(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [costumesRes, categoriesRes]: any = await Promise.all([
        api.get('/admin/costumes?limit=50'),
        api.get('/categories'),
      ]);
      setCostumes(costumesRes.data?.items || costumesRes.items || []);
      setCategories(categoriesRes.data || categoriesRes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách trang phục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
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

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setSlug('');
    setCharacterName('');
    setSeriesName('');
    setDescription('');
    setDailyPrice(150000);
    setDepositAmount(500000);
    setImageUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800');
    setCategoryId(categories[0]?.id || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (c: Costume) => {
    setIsEditMode(true);
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setCharacterName(c.characterName || '');
    setSeriesName(c.seriesName || '');
    setDescription(c.description);
    setDailyPrice(c.dailyPrice);
    setDepositAmount(c.depositAmount);
    setImageUrl(c.primaryImage || '');
    setCategoryId(c.categoryId);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCostume = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (isEditMode && editingId) {
        await api.put(`/admin/costumes/${editingId}`, {
          categoryId,
          name,
          characterName: characterName || undefined,
          seriesName: seriesName || undefined,
          description,
          dailyPrice: Number(dailyPrice),
          depositAmount: Number(depositAmount),
        });
      } else {
        await api.post('/admin/costumes', {
          categoryId,
          name,
          slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
          characterName: characterName || undefined,
          seriesName: seriesName || undefined,
          description,
          dailyPrice: Number(dailyPrice),
          depositAmount: Number(depositAmount),
          images: imageUrl ? [{ imageUrl, altText: name, isPrimary: true }] : undefined,
          variants: [
            { size: 'M', sku: `CR-${Date.now().toString().slice(-4)}-M`, totalQuantity: 3 },
            { size: 'L', sku: `CR-${Date.now().toString().slice(-4)}-L`, totalQuantity: 2 },
          ],
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu thông tin trang phục.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/admin/costumes/${id}/toggle-active`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể chuyển trạng thái trang phục.');
    }
  };

  const handleOpenStockModal = (v: CostumeVariant) => {
    setSelectedVariant(v);
    setTotalQuantity(v.totalQuantity);
    setOutOfServiceQuantity(v.outOfServiceQuantity);
    setStockError(null);
    setShowStockModal(true);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setStockSaving(true);
    setStockError(null);

    try {
      await api.patch(`/admin/variants/${selectedVariant.id}/stock`, {
        totalQuantity: Number(totalQuantity),
        outOfServiceQuantity: Number(outOfServiceQuantity),
      });
      setShowStockModal(false);
      fetchData();
    } catch (err: any) {
      setStockError(err.response?.data?.message || 'Lỗi khi cập nhật tồn kho.');
    } finally {
      setStockSaving(false);
    }
  };

  // Filter costumes by keyword and category
  const filteredCostumes = costumes.filter((c) => {
    const matchKw =
      !keyword ||
      c.name.toLowerCase().includes(keyword.toLowerCase()) ||
      (c.characterName && c.characterName.toLowerCase().includes(keyword.toLowerCase()));
    const matchCat = !selectedCategory || c.categoryId === selectedCategory;
    return matchKw && matchCat;
  });

  return (
    <div className="py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">
              <i className="bi bi-tags-fill text-warning me-2"></i>Quản Lý Trang Phục & Tồn Kho
            </h3>
            <p className="text-muted small mb-0">
              Thêm mới, sửa đổi thông tin, ẩn/hiện sản phẩm và điều chỉnh số lượng an toàn
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="fw-semibold">
            <i className="bi bi-plus-lg me-1"></i> Thêm trang phục mới
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="border-0 shadow-sm p-3 bg-white rounded mb-4">
          <Row className="g-2">
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="Tìm theo tên trang phục hoặc nhân vật..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5 bg-white rounded border shadow-sm">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Đang tải danh sách trang phục...</p>
          </div>
        ) : (
          <Card className="border-0 shadow-sm bg-white rounded overflow-hidden">
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th>Hình ảnh & Tên</th>
                  <th>Danh mục</th>
                  <th>Giá thuê / ngày</th>
                  <th>Tiền cọc</th>
                  <th>Kích cỡ & Tồn kho</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCostumes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ minWidth: '220px' }}>
                      <div className="d-flex align-items-center">
                        <img
                          src={c.primaryImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800'}
                          alt={c.name}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                          className="me-2"
                        />
                        <div>
                          <span className="fw-bold small d-block">{c.name}</span>
                          <small className="text-muted">{c.characterName || c.seriesName}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {c.category?.name || 'Khác'}
                      </Badge>
                    </td>
                    <td className="fw-bold text-danger">
                      {c.dailyPrice.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="text-secondary small">
                      {c.depositAmount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {c.variants?.map((v) => (
                          <Button
                            key={v.id}
                            variant="outline-secondary"
                            size="sm"
                            className="py-0 px-1"
                            style={{ fontSize: '0.72rem' }}
                            title="Click để điều chỉnh tồn kho kích cỡ này"
                            onClick={() => handleOpenStockModal(v)}
                          >
                            {v.size}: {v.totalQuantity - v.outOfServiceQuantity}/{v.totalQuantity}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td>
                      {c.isActive ? (
                        <Badge bg="success">Đang hiện</Badge>
                      ) : (
                        <Badge bg="secondary">Đã ẩn</Badge>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1 py-1"
                        onClick={() => handleOpenEditModal(c)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant={c.isActive ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="py-1"
                        onClick={() => handleToggleActive(c.id)}
                        title="Ẩn hoặc hiện trang phục mà không làm mất lịch sử giao dịch"
                      >
                        {c.isActive ? 'Ẩn' : 'Hiện'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        {/* Modal Thêm / Sửa trang phục */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Form onSubmit={handleSaveCostume}>
            <Modal.Header closeButton>
              <Modal.Title className="h5 fw-bold">
                {isEditMode ? 'Chỉnh sửa thông tin trang phục' : 'Thêm trang phục mới'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

              <Row className="g-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Tên trang phục *</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!isEditMode) {
                          setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }
                      }}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Danh mục *</Form.Label>
                    <Form.Select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {!isEditMode && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Slug duy nhất *</Form.Label>
                      <Form.Control
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Tên nhân vật</Form.Label>
                    <Form.Control
                      type="text"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Bộ anime / Game</Form.Label>
                    <Form.Control
                      type="text"
                      value={seriesName}
                      onChange={(e) => setSeriesName(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Giá thuê / ngày (VNĐ) *</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={dailyPrice}
                      onChange={(e) => setDailyPrice(Number(e.target.value))}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Tiền cọc quy định (VNĐ) *</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      required
                    />
                  </Form.Group>
                </Col>

                {!isEditMode && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">URL Hình ảnh chính</Form.Label>
                      <Form.Control
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                )}

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Mô tả chi tiết & Phụ kiện *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Lưu trang phục
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Quản lý Tồn kho Biến thể */}
        <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
          <Form onSubmit={handleSaveStock}>
            <Modal.Header closeButton>
              <Modal.Title className="h6 fw-bold">
                Quản lý Tồn kho Biến thể (Size {selectedVariant?.size})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {stockError && <Alert variant="danger" className="py-2 small">{stockError}</Alert>}

              <p className="small text-muted mb-3">
                Mã SKU: <code>{selectedVariant?.sku}</code>
                <br />
                Quy tắc an toàn: Hệ thống sẽ chặn giảm tổng kho nếu số lượng thấp hơn các đơn đã xác nhận trước đó.
              </p>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Tổng số lượng sở hữu *</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(Number(e.target.value))}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Số lượng hỏng / đang bảo dưỡng *</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={outOfServiceQuantity}
                  onChange={(e) => setOutOfServiceQuantity(Number(e.target.value))}
                  required
                />
                <Form.Text className="small text-muted">
                  Hàng đang sửa chữa sẽ không được tính vào lịch cho thuê
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" size="sm" onClick={() => setShowStockModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={stockSaving}>
                {stockSaving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Lưu số lượng
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};
