-- ====================================================================
-- CosRent Database Seed Extension: Trang Phục Dân Tộc & Váy Chụp Ảnh
-- Tương thích: PostgreSQL 14+, pg-mem, MySQL 8.0+
-- ====================================================================

-- 1. Chèn Danh mục mới
INSERT INTO "categories" ("id", "name", "slug", "description", "displayOrder", "isActive")
VALUES
  ('c1000000-0000-0000-0000-000000000006', 'Váy & Đồ Chụp Ảnh', 'vay-chup-anh', 'Váy dạ hội, vintage nàng thơ, váy kỷ yếu & chụp ảnh nghệ thuật', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Trang Phục Dân Tộc', 'trang-phuc-dan-toc', 'Trang phục H''Mông, Thái, Dao, Cổ phục Việt Nhật Bình & Áo dài', 7, true),
  ('c1000000-0000-0000-0000-000000000008', 'Đồ Đi Chơi & Concept', 'do-di-choi-concept', 'Trang phục Bohemian, Y2K dã ngoại, du lịch & chụp ảnh nhóm', 8, true)
ON CONFLICT ("slug") DO NOTHING;

-- 2. Chèn Trang phục mới
-- 2.1 Váy & Đồ Chụp Ảnh
INSERT INTO "costumes" ("id", "categoryId", "name", "slug", "characterName", "seriesName", "description", "dailyPrice", "depositAmount", "isActive")
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000006',
    'Váy Nàng Thơ Trắng Vintage - Concept Ngoại Cảnh',
    'vay-nang-tho-trang-vintage',
    'Nàng Thơ Vintage',
    'Trang phục chụp ảnh ngoại cảnh',
    'Váy xòe trắng nhiều tầng voan tơ cao cấp, tay bồng tiểu thư, lưng đan dây ngọc trai tinh tế. Kèm mũ cói vintage, giỏ hoa khô dã ngoại và nơ cài tóc ren.',
    150000,
    400000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000006',
    'Váy Dạ Hội Công Chúa Lấp Lánh - Chụp Studio & Prom',
    'vay-da-hoi-cong-chua-lap-lanh',
    'Công Chúa Prom',
    'Dạ tiệc & Kỷ yếu',
    'Váy dạ hội cúp ngực đính kim sa lấp lánh, tùng váy phồng 5 lớp bồng bềnh hoàng gia. Kèm vương miện ngọc trai, găng tay ren trắng cao cấp.',
    250000,
    800000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000006',
    'Váy Lolita Công Chúa Trà Chiều (Sweet & Classic)',
    'vay-lolita-cong-chua-tra-chieu',
    'Tiểu Thư Lolita',
    'Trang phục thời trang Harajuku',
    'Váy Lolita xòe phồng công chúa phối ren đăng ten nhiều tầng, cổ áo thêu hoa baby nhã nhặn. Kèm headdress nơ cài đầu phối ngọc trai và găng tay ren tiểu thư.',
    180000,
    500000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000006',
    'Váy Maxi Hoa Nhí Vintage Đi Biển & Du Lịch',
    'vay-maxi-hoa-nhi-vintage',
    'Du Khách Nàng Thơ',
    'Trang phục du lịch dã ngoại',
    'Váy maxi dài chấm gót họa tiết hoa nhí phong cách Pháp, chất liệu voan tơ cát bay bổng trong gió. Kèm nón cói rộng vành đi biển, túi cói dệt tay và kính râm mát.',
    120000,
    300000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000006',
    'Váy Nhung Đỏ Rượu Vang Quý Tộc - Chụp Studio Nghệ Thuật',
    'vay-nhung-do-ruou-vang-quy-toc',
    'Quý Tộc Sang Trọng',
    'Trang phục tiệc & Concept Studio',
    'Váy dạ hội nhung the cao cấp màu đỏ burgundy tôn làn da trắng sứ, xẻ tà cao khoe dáng thanh thoát. Kèm găng tay nhung đen dài qua khuỷu tay và vòng cổ ngọc trai.',
    220000,
    650000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000006',
    'Set Váy Cưới Mini Ngắn Công Chúa Chụp Kỷ Yếu',
    'set-vay-cuoi-mini-ky-yeu',
    'Cô Dâu Kỷ Yếu',
    'Trang phục kỷ yếu & Ảnh cưới nghệ thuật',
    'Váy cưới dáng ngắn cúp ngực đính hoa 3D nổi và kim tuyến lấp lánh, đuôi váy voan xếp ly trẻ trung năng động. Kèm khăn voan trùm đầu cô dâu 2 tầng và hoa cưới cầm tay.',
    200000,
    600000,
    true
  );

-- 2.2 Trang Phục Dân Tộc & Cổ Phục
INSERT INTO "costumes" ("id", "categoryId", "name", "slug", "characterName", "seriesName", "description", "dailyPrice", "depositAmount", "isActive")
VALUES
  (
    'e1000000-0000-0000-0000-000000000007',
    'c1000000-0000-0000-0000-000000000007',
    'Trang Phục Dân Tộc H''Mông Hoa Cao Cấp (Tây Bắc)',
    'trang-phuc-dan-toc-hmong-hoa',
    'Thiếu Nữ H''Mông',
    'Trang phục truyền thống Tây Bắc',
    'Trọn bộ trang phục dân tộc H''Mông hoa thêu thổ cẩm thủ công tinh xảo, chân váy xòe đính chuông bạc kêu leng keng vui tai, áo cóm viền chỉ ngũ sắc. Kèm mũ bạc đính hạt, kiềng bạc và xà cạp thổ cẩm.',
    180000,
    500000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000008',
    'c1000000-0000-0000-0000-000000000007',
    'Trang Phục Dân Tộc H''Mông Nam Tây Bắc',
    'trang-phuc-dan-toc-hmong-nam',
    'Chàng Trai H''Mông',
    'Trang phục truyền thống Tây Bắc',
    'Áo chàm vạt ngắn xẻ ngực viền thổ cẩm, quần thụng vải thô đen dễ vận động, đai thắt lưng ngũ sắc đính chuông. Kèm mũ nồi thổ cẩm và mô hình khèn bè H''Mông truyền thống.',
    150000,
    400000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000009',
    'c1000000-0000-0000-0000-000000000007',
    'Trang Phục Dân Tộc Thái Trắng Điện Biên',
    'trang-phuc-dan-toc-thai-trang',
    'Thiếu Nữ Thái',
    'Trang phục truyền thống Điện Biên',
    'Áo cóm trắng tinh khôi cài hàng cúc bướm bạc (Hàng mạy tạy), thắt lưng xôi xanh ngọc lục bảo tôn đường cong, váy dài đen chấm gót. Kèm khăn Piêu thêu hoa văn chỉ đỏ truyền thống.',
    160000,
    450000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000010',
    'c1000000-0000-0000-0000-000000000007',
    'Trang Phục Dân Tộc Dao Đỏ Tả Phìn Sa Pa',
    'trang-phuc-dan-toc-dao-do',
    'Thiếu Nữ Dao Đỏ',
    'Trang phục truyền thống Sa Pa',
    'Trọn bộ trang phục thêu chỉ đỏ rực rỡ đặc trưng của người Dao Đỏ, mũ đội đầu đính chùm quả bông đỏ bồng bềnh nổi tiếng, áo chàm thêu hoa văn quả trám bạc, yếm hoa và xà cạp dệt tay.',
    190000,
    550000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000011',
    'c1000000-0000-0000-0000-000000000007',
    'Trang Phục Dân Tộc Chăm Pa Ninh Thuận',
    'trang-phuc-dan-toc-cham',
    'Vũ Nữ Chăm Pa',
    'Trang phục truyền thống Duyên hải Nam Trung Bộ',
    'Áo dài Chăm Aw chêch thêu hoa văn kim tuyến lấp lánh, váy quấn xòe Talei ka-in phối màu đỏ vàng cung đình, khăn choàng vai Mat''ra lụa mềm mại. Kèm vòng tay và kiềng chạm khắc hoa văn tháp Chăm.',
    170000,
    450000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000012',
    'c1000000-0000-0000-0000-000000000007',
    'Cổ Phục Việt Nhật Bình Triều Nguyễn',
    'co-phuc-viet-nhat-binh-trieu-nguyen',
    'Mệnh Phụ Triều Nguyễn',
    'Cổ phục Việt Nam',
    'Áo Nhật Bình may theo lối cổ phục cung đình Huế, chất liệu gấm dệt hoa văn phượng hoàng, cổ áo ghép ngũ sắc phong thủy, dải cúc ngọc trai. Kèm khăn vấn và quạt xếp cung đình dát kim.',
    220000,
    700000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000013',
    'c1000000-0000-0000-0000-000000000007',
    'Cổ Phục Việt: Áo Tấc Ngũ Thân Truyền Thống',
    'co-phuc-viet-ao-tac-ngu-than',
    'Nho Sĩ & Mệnh Phụ',
    'Cổ phục Việt Nam',
    'Áo Tấc (áo ngũ thân tay thụng) chuẩn phom dáng triều Nguyễn, chất liệu lụa tơ tằm dệt hoa văn chữ Thọ cao cấp, tay thụng rộng trang trọng. Kèm khăn đóng quấn sẵn, chuỗi hạt gỗ mun và thẻ bài ngọc.',
    200000,
    600000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000014',
    'c1000000-0000-0000-0000-000000000007',
    'Áo Dài Cô Ba Sài Gòn Retro Thập Niên 70',
    'ao-dai-retro-co-ba-sai-gon',
    'Tiểu Thư Sài Thành',
    'Trang phục Retro Việt Nam',
    'Áo dài lụa họa tiết gạch bông retro hoặc chấm bi pop-art kinh điển, chiết eo tôn dáng thiếu nữ Sài Gòn xưa, quần phi bóng trắng suông dài. Kèm băng đô turban cài tóc và kính mắt mèo vintage.',
    130000,
    350000,
    true
  );

-- 2.3 Đồ Đi Chơi & Concept Dã Ngoại
INSERT INTO "costumes" ("id", "categoryId", "name", "slug", "characterName", "seriesName", "description", "dailyPrice", "depositAmount", "isActive")
VALUES
  (
    'e1000000-0000-0000-0000-000000000015',
    'c1000000-0000-0000-0000-000000000008',
    'Set Bohemian Du Lịch & Dã Ngoại Thảo Nguyên',
    'set-bohemian-du-lich-da-ngoai',
    'Du Mục Bohemian',
    'Trang phục du lịch dã ngoại',
    'Trọn bộ phong cách du mục phóng khoáng gồm váy maxi hoa văn thổ cẩm, áo khoác len tua rua đan tay, khăn turban đội đầu, đai da vintage bản lớn và vòng đeo tay lông vũ.',
    140000,
    350000,
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000016',
    'c1000000-0000-0000-0000-000000000008',
    'Set Y2K Năng Động Dạo Phố Đi Bộ & Sống Ảo',
    'set-y2k-nang-dong-dao-pho',
    'Hot Girl Y2K',
    'Trang phục dạo phố xu hướng',
    'Set đồ phong cách Y2K sành điệu gồm áo baby tee in graphic retro, chân váy ngắn xếp ly cargo có túi hộp, thắt lưng xích bạc kim loại. Kèm tất ống chân len sành điệu và kính râm mini gọng bạc.',
    110000,
    300000,
    true
  )
ON CONFLICT ("slug") DO NOTHING;

-- 3. Chèn Biến thể (Variants: S, M, L, XL, FreeSize) cho từng trang phục
INSERT INTO "costume_variants" ("id", "costumeId", "size", "sku", "quantity", "availableQuantity")
VALUES
  -- Váy nàng thơ
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 'S', 'CR-VAYTHO-S', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 'M', 'CR-VAYTHO-M', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 'L', 'CR-VAYTHO-L', 2, 2),

  -- Váy dạ hội
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 'S', 'CR-DAHOI-S', 2, 2),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 'M', 'CR-DAHOI-M', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 'L', 'CR-DAHOI-L', 2, 2),

  -- H'Mông hoa Sa Pa
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 'S', 'CR-HMONG-S', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 'M', 'CR-HMONG-M', 5, 5),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 'L', 'CR-HMONG-L', 3, 3),

  -- H'Mông nam Tây Bắc
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', 'M', 'CR-HMONGNAM-M', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', 'L', 'CR-HMONGNAM-L', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', 'XL', 'CR-HMONGNAM-XL', 2, 2),

  -- Thái trắng Điện Biên
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', 'S', 'CR-THAI-S', 2, 2),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', 'M', 'CR-THAI-M', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', 'L', 'CR-THAI-L', 2, 2),

  -- Dao đỏ Tả Phìn Sa Pa
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000010', 'S', 'CR-DAODO-S', 2, 2),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000010', 'M', 'CR-DAODO-M', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000010', 'L', 'CR-DAODO-L', 2, 2),

  -- Cổ phục Nhật Bình
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000012', 'S', 'CR-NHATBINH-S', 2, 2),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000012', 'M', 'CR-NHATBINH-M', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000012', 'L', 'CR-NHATBINH-L', 2, 2),

  -- Cổ phục Áo Tấc
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000013', 'S', 'CR-AOTAC-S', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000013', 'M', 'CR-AOTAC-M', 5, 5),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000013', 'L', 'CR-AOTAC-L', 3, 3),

  -- Áo Dài Cô Ba Sài Gòn
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000014', 'S', 'CR-COBA-S', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000014', 'M', 'CR-COBA-M', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000014', 'L', 'CR-COBA-L', 2, 2),

  -- Set Bohemian du lịch
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000015', 'S', 'CR-BOHO-S', 3, 3),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000015', 'M', 'CR-BOHO-M', 4, 4),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000015', 'FreeSize', 'CR-BOHO-FS', 3, 3);

