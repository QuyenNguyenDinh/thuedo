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
import { Navigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../types';

interface CategoryWithCount extends Category {
  costumeCount?: number;
  costumesCount?: number;
}

export const AdminCategoriesPage: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/admin/categories');
      setCategories(res.data || res || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
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
    setDescription('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: CategoryWithCount) => {
    setIsEditMode(true);
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditMode) {
      // Auto-generate slug from name
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (isEditMode && editingId) {
        await api.put(`/admin/categories/${editingId}`, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await api.post('/admin/categories', {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || undefined,
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu thông tin danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (cat: CategoryWithCount) => {
    setDeletingCategory(cat);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/categories/${deletingCategory.id}`);
      setShowDeleteModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục này.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-light py-4 min-vh-100">
      <Container>
        {/* Header Breadcrumb */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb small mb-1">
                <li className="breadcrumb-item">
                  <Link to="/admin/dashboard" className="text-decoration-none">
                    Quản trị
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Danh mục trang phục
                </li>
              </ol>
            </nav>
            <h3 className="fw-bold mb-0">Quản Lý Danh Mục Trang Phục</h3>
            <p className="text-muted small mb-0">
              Phân loại chủ đề trang phục (Anime, Game, Cổ phong, Superhero, Vocaloid)
            </p>
          </div>
          <div className="mt-3 mt-md-0 d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={fetchCategories} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-circle me-1"></i> Thêm danh mục mới
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="border-0 shadow-sm rounded">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted small mt-2">Đang tải danh sách danh mục...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-folder-x fs-1 text-muted"></i>
                <p className="text-muted mt-2">Chưa có danh mục nào trong hệ thống.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '60px' }}>STT</th>
                      <th>Tên danh mục</th>
                      <th>Đường dẫn tĩnh (Slug)</th>
                      <th>Mô tả thể loại</th>
                      <th className="text-center">Số trang phục</th>
                      <th className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id}>
                        <td className="text-muted fw-semibold ps-3">{idx + 1}</td>
                        <td>
                          <div className="fw-bold text-dark">{cat.name}</div>
                          <small className="text-muted">ID: {cat.id.slice(0, 8)}...</small>
                        </td>
                        <td>
                          <code className="text-primary bg-light px-2 py-1 rounded">
                            {cat.slug}
                          </code>
                        </td>
                        <td>
                          <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                            {cat.description || 'Chưa có mô tả'}
                          </span>
                        </td>
                        <td className="text-center">
                          <Badge bg="info" className="px-2 py-1">
                            {cat.costumesCount ?? cat.costumeCount ?? 0} bộ
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleOpenEditModal(cat)}
                          >
                            <i className="bi bi-pencil me-1"></i> Sửa
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(cat)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal Create / Edit */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Form onSubmit={handleSaveCategory}>
            <Modal.Header closeButton>
              <Modal.Title className="h5 fw-bold">
                {isEditMode ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Trang Phục Mới'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Tên danh mục *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ví dụ: Cổ phong & Hanfu"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  Đường dẫn tĩnh (Slug) {!isEditMode && <span className="text-muted">(Tự sinh)</span>} *
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="co-phong-hanfu"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={isEditMode}
                  required
                />
                <Form.Text className="text-muted">
                  Định danh URL duy nhất, viết thường không dấu cách, ngăn cách bằng dấu gạch ngang.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Mô tả tóm tắt</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Trang phục cổ trang, Hán phục truyền thống..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving}>
                {saving ? <Spinner animation="border" size="sm" /> : isEditMode ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Delete Confirmation */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Xác nhận xóa danh mục</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="small mb-0">
              Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCategory?.name}</strong>?
            </p>
            {((deletingCategory?.costumesCount ?? deletingCategory?.costumeCount ?? 0) > 0) ? (
              <Alert variant="warning" className="mt-3 mb-0 small">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                Danh mục này đang có <strong>{deletingCategory?.costumesCount ?? deletingCategory?.costumeCount}</strong> trang phục. Vui lòng chuyển các trang phục sang danh mục khác trước khi xóa.
              </Alert>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? <Spinner animation="border" size="sm" /> : 'Xác nhận xóa'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};
