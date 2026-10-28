# Bảng Kiểm Tra Nộp Bài Cuối Kỳ (Final Submission Checklist)
**Dự án: CosRent – Hệ Thống Cho Thuê Trang Phục & Đồ Cosplay**
*Môn học: Phát triển Ứng dụng Web Nâng cao (WebNC)*
*Mã tài liệu: DOC-CHECK-01 | Phiên bản: 1.0.0*

---

## 1. Các Mốc Thời Hạn Bắt Buộc (Deadlines)

| Hình Thức Nộp | Kênh / Địa Điểm Nộp | Hạn Chót (Deadline) | Trạng Thái Nhóm |
| :--- | :--- | :--- | :---: |
| **Nộp Bản Mềm (PDF)** | Hệ thống Canvas Phenikaa | **Trước 23:59 ngày 31/10/2026** | [ ] SẴN SÀNG |
| **Nộp Bản Cứng (In giấy)** | Văn phòng Khoa CNTT / Bàn Giảng viên | **Trước 17:00 ngày 02/11/2026** | [ ] SẴN SÀNG |

---

## 2. Danh Mục Kiểm Tra Bản Mềm Trực Tuyến (Canvas Submission)

- [ ] **Định dạng file nộp**: Tệp tin định dạng `.pdf`.
- [ ] **Trang bìa báo cáo**:
  - [ ] Ghi rõ Tên đề tài: *Hệ thống Website cho thuê trang phục và đồ cosplay CosRent*.
  - [ ] Ghi đúng Họ và tên, Mã số sinh viên (MSSV) của chính sinh viên nộp bài.
  - [ ] Tên Giảng viên hướng dẫn môn học.
- [ ] **Các đường dẫn bắt buộc trong báo cáo**:
  - [ ] Đường dẫn kho lưu trữ mã nguồn GitHub: `[CẦN BỔ SUNG: Link GitHub công khai hoặc chia sẻ quyền cho GV]`
  - [ ] Đường dẫn Video Demo trên YouTube / Google Drive (< 8 phút): `[CẦN BỔ SUNG: Link Video Demo]`
- [ ] **Nội dung báo cáo**: Đầy đủ 10 câu hỏi theo đề cương (Câu 1 đến Câu 10), có bảng phân công đóng góp và tỷ lệ phần trăm cụ thể của từng thành viên.
- [ ] **Kiểm tra xuất file**: File `docs/report.md` là tài liệu nguồn dạng Markdown. Sinh viên cần chuyển đổi thành file PDF hoàn chỉnh (qua VS Code Print to PDF hoặc công cụ chuyển đổi), kiểm tra không bị lỗi layout bảng hay sơ đồ Mermaid trước khi nộp lên Canvas.

---

## 3. Danh Mục Kiểm Tra Bản Cứng In Giấy (Physical Hard Copy Submission)

- [ ] **Số lượng bản in**: Mỗi sinh viên trong nhóm có **MỘT BẢN RIÊNG BIỆT**, trang bìa ghi đúng Tên và MSSV của cá nhân mình (không dùng chung 1 bản cho cả nhóm).
- [ ] **Chất lượng in**: Đóng bìa cứng hoặc bìa bóng kính chỉn chu, các bảng biểu và sơ đồ in rõ nét, không bị mất lề.
- [ ] **Chữ ký xác nhận**:
  - [ ] Tất cả thành viên trong nhóm đã ký tươi xác nhận vào Bảng phân công đóng góp (`docs/contributions.md`).
- [ ] **Ký danh sách nộp bài**:
  - [ ] [QUAN TRỌNG] Khi mang bài nộp trực tiếp trước 17:00 ngày 02/11/2026, sinh viên **bắt buộc phải ký tên vào Bảng danh sách nộp bài của Khoa / Giảng viên** để làm bằng chứng pháp lý đã nộp bài.

---

## 4. Danh Mục Kiểm Tra Chất Lượng Mã Nguồn & Kỹ Thuật

- [ ] Đã kiểm tra `.gitignore`: Không bị commit thư mục `node_modules`, file bí mật `.env`, token hoặc file sinh tự động.
- [ ] Cung cấp đầy đủ file `.env.example` và `docker-compose.yml` cho PostgreSQL.
- [ ] Backend phân lớp rõ: Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database.
- [ ] Có đầy đủ 20 User Stories trong `docs/user-stories.md`.
- [ ] Đã chạy và vượt qua toàn bộ Unit Test, Integration Test và E2E Test.
- [ ] Có dữ liệu Seed mẫu tối thiểu 20 trang phục và đơn hàng mẫu cho mọi trạng thái.
- [ ] Swagger hoạt động tốt tại `http://localhost:3000/api/docs`.
