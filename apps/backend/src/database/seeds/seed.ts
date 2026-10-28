import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { User } from '../../entities/user.entity';
import { Category } from '../../entities/category.entity';
import { Costume } from '../../entities/costume.entity';
import { CostumeImage } from '../../entities/costume-image.entity';
import { CostumeVariant } from '../../entities/costume-variant.entity';
import { RentalOrder } from '../../entities/rental-order.entity';
import { RentalOrderItem } from '../../entities/rental-order-item.entity';
import { RentalStatusHistory } from '../../entities/rental-status-history.entity';
import { Role } from '../../common/enums/role.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

export async function runSeed(dataSource: DataSource) {
  console.log('--- BẮT ĐẦU NẠP DỮ LIỆU SEED (COSRent) ---');

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const costumeRepo = dataSource.getRepository(Costume);
  const imageRepo = dataSource.getRepository(CostumeImage);
  const variantRepo = dataSource.getRepository(CostumeVariant);
  const orderRepo = dataSource.getRepository(RentalOrder);
  const orderItemRepo = dataSource.getRepository(RentalOrderItem);
  const historyRepo = dataSource.getRepository(RentalStatusHistory);

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Admin123@', 10);
  const custPasswordHash = await bcrypt.hash('Customer123@', 10);

  let admin = await userRepo.findOne({ where: { email: 'admin@cosrent.com' } });
  if (!admin) {
    admin = userRepo.create({
      email: 'admin@cosrent.com',
      passwordHash,
      fullName: 'Quản Trị Viên CosRent',
      phone: '0988888888',
      address: 'Cửa hàng CosRent, 123 Đường Láng, Đống Đa, Hà Nội',
      role: Role.ADMIN,
    });
    admin = await userRepo.save(admin);
    console.log('✓ Đã tạo tài khoản Admin: admin@cosrent.com / Admin123@');
  }

  let adminVn = await userRepo.findOne({ where: { email: 'admin@cosrent.vn' } });
  if (!adminVn) {
    adminVn = userRepo.create({
      email: 'admin@cosrent.vn',
      passwordHash,
      fullName: 'Quản Trị Viên CosRent (VN)',
      phone: '0988888888',
      address: 'Cửa hàng CosRent, 123 Đường Láng, Đống Đa, Hà Nội',
      role: Role.ADMIN,
    });
    await userRepo.save(adminVn);
  }

  let customer1 = await userRepo.findOne({ where: { email: 'customer@cosrent.com' } });
  if (!customer1) {
    customer1 = userRepo.create({
      email: 'customer@cosrent.com',
      passwordHash: custPasswordHash,
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      address: 'Số 10 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
      role: Role.CUSTOMER,
    });
    customer1 = await userRepo.save(customer1);
    console.log('✓ Đã tạo tài khoản Customer: customer@cosrent.com / Customer123@');
  }

  let customer1Vn = await userRepo.findOne({ where: { email: 'customer@cosrent.vn' } });
  if (!customer1Vn) {
    customer1Vn = userRepo.create({
      email: 'customer@cosrent.vn',
      passwordHash: custPasswordHash,
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      address: 'Số 10 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
      role: Role.CUSTOMER,
    });
    await userRepo.save(customer1Vn);
  }

  let customer2 = await userRepo.findOne({ where: { email: 'customer2@cosrent.com' } });
  if (!customer2) {
    customer2 = userRepo.create({
      email: 'customer2@cosrent.com',
      passwordHash: custPasswordHash,
      fullName: 'Trần Thị Bình',
      phone: '0987654321',
      address: 'Số 25 Cầu Giấy, Hà Nội',
      role: Role.CUSTOMER,
    });
    customer2 = await userRepo.save(customer2);
    console.log('✓ Đã tạo tài khoản Customer 2: customer2@cosrent.com / Customer123@');
  }

  // 2. Seed Categories
  const categoryDefs = [
    { name: 'Anime & Manga', slug: 'anime-manga', description: 'Trang phục từ các bộ anime/manga Nhật Bản nổi tiếng', displayOrder: 1 },
    { name: 'Game Cosplay', slug: 'game-cosplay', description: 'Genshin Impact, Honkai Star Rail, League of Legends, Fate...', displayOrder: 2 },
    { name: 'Cổ phong & Hanfu', slug: 'co-phong-hanfu', description: 'Trang phục cổ trang, Hán phục, kiếm hiệp và tiên hiệp', displayOrder: 3 },
    { name: 'Siêu anh hùng & Comic', slug: 'sieu-anh-hung', description: 'Marvel, DC, Spider-Man, Batman, Deadpool...', displayOrder: 4 },
    { name: 'Vocaloid & Thần tượng', slug: 'vocaloid-idol', description: 'Hatsune Miku, Oshi no Ko, Love Live...', displayOrder: 5 },
  ];

  const catMap = new Map<string, Category>();
  for (const c of categoryDefs) {
    let cat = await categoryRepo.findOne({ where: { slug: c.slug } });
    if (!cat) {
      cat = categoryRepo.create({ ...c, isActive: true });
      cat = await categoryRepo.save(cat);
    }
    catMap.set(c.slug, cat);
  }
  console.log(`✓ Đã nạp ${catMap.size} danh mục trang phục.`);

  // 3. Seed 20+ Costumes with images and variants
  const costumeDefs = [
    {
      cat: 'game-cosplay',
      name: 'Raiden Shogun - Genshin Impact',
      slug: 'raiden-shogun-genshin-impact',
      character: 'Raiden Shogun (Ei)',
      series: 'Genshin Impact',
      desc: 'Trọn bộ trang phục Kimono lụa gấm cách tân cao cấp, đai lưng Obi thêu hoa văn sấm sét, giáp vai kim loại phủ ánh tím, bao gồm tóc giả (wig) tím dài thắt báng súng và phụ kiện kẹp tóc.',
      price: 200000,
      deposit: 600000,
      images: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-RAIDEN-S', qty: 2 },
        { size: 'M', sku: 'CR-RAIDEN-M', qty: 3 },
        { size: 'L', sku: 'CR-RAIDEN-L', qty: 2 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Anya Forger - SPY x FAMILY',
      slug: 'anya-forger-spy-family',
      character: 'Anya Forger',
      series: 'SPY x FAMILY',
      desc: 'Đồng phục Học viện Eden danh giá gồm váy nhung đen đính cúc vàng sang trọng, áo sơ mi cổ bèo trắng, tất đùi trắng và sừng tóc tai chồn đặc trưng.',
      price: 120000,
      deposit: 400000,
      images: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-ANYA-S', qty: 2 },
        { size: 'M', sku: 'CR-ANYA-M', qty: 4 },
        { size: 'L', sku: 'CR-ANYA-L', qty: 2 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Frieren - Pháp Sư Tiễn Biệt',
      slug: 'frieren-sousou-no-frieren',
      character: 'Frieren',
      series: 'Frieren: Beyond Journey\'s End',
      desc: 'Áo choàng dạ trắng viền vàng, đầm đen xếp ly, khuyên tai giọt nước đỏ hồng, kèm tóc giả hai bím bạch kim và gậy phép thuật gỗ cao cấp.',
      price: 180000,
      deposit: 500000,
      images: [
        'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=800',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-FRIEREN-S', qty: 2 },
        { size: 'M', sku: 'CR-FRIEREN-M', qty: 3 },
      ],
    },
    {
      cat: 'game-cosplay',
      name: 'Hu Tao - Đường Chủ Vãng Sinh Đường',
      slug: 'hu-tao-genshin-impact',
      character: 'Hu Tao',
      series: 'Genshin Impact',
      desc: 'Áo khoác đuôi tôm đen tuyền thêu hoa mai, quần short, mũ chóp đính cành hoa mai kèm nhẫn ngọc, tất chân và tóc giả buộc hai bên.',
      price: 190000,
      deposit: 550000,
      images: [
        'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-HUTAO-S', qty: 2 },
        { size: 'M', sku: 'CR-HUTAO-M', qty: 3 },
        { size: 'L', sku: 'CR-HUTAO-L', qty: 2 },
      ],
    },
    {
      cat: 'game-cosplay',
      name: 'Furina - Thần Nước Fontaine',
      slug: 'furina-genshin-impact',
      character: 'Furina (Focalors)',
      series: 'Genshin Impact',
      desc: 'Bộ âu phục quý tộc Pháp màu xanh biển và trắng thanh lịch, áo ghi lê đính cúc ngọc, mũ xiếc mini có lông vũ và tóc giả bạch kim highlight xanh biển.',
      price: 220000,
      deposit: 700000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-FURINA-S', qty: 2 },
        { size: 'M', sku: 'CR-FURINA-M', qty: 3 },
        { size: 'L', sku: 'CR-FURINA-L', qty: 1 },
      ],
    },
    {
      cat: 'vocaloid-idol',
      name: 'Hatsune Miku - Trang Phục Mặc Định',
      slug: 'hatsune-miku-classic',
      character: 'Hatsune Miku',
      series: 'Vocaloid',
      desc: 'Áo sát nách xám viền xanh ngọc bích, caravat xanh dạ quang, chân váy xếp ly xòe, găng tay áo choàng dài viền mạch điện tử, tóc giả xanh ngọc bím đôi 1m2.',
      price: 150000,
      deposit: 500000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-MIKU-S', qty: 3 },
        { size: 'M', sku: 'CR-MIKU-M', qty: 4 },
        { size: 'L', sku: 'CR-MIKU-L', qty: 2 },
      ],
    },
    {
      cat: 'vocaloid-idol',
      name: 'Hoshino Ai - Oshi no Ko',
      slug: 'hoshino-ai-oshi-no-ko',
      character: 'Hoshino Ai',
      series: 'Oshi no Ko',
      desc: 'Đầm thần tượng B-Komachi màu hồng cánh sen rực rỡ, đai eo đính hoa, găng tay lụa trắng, kẹp tóc thỏ hồng và tóc giả tím hồng dài buộc lệch.',
      price: 170000,
      deposit: 500000,
      images: [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-AI-S', qty: 2 },
        { size: 'M', sku: 'CR-AI-M', qty: 3 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Kamado Tanjiro - Kimetsu no Yaiba',
      slug: 'kamado-tanjiro-demonslayer',
      character: 'Kamado Tanjiro',
      series: 'Kimetsu no Yaiba',
      desc: 'Haori kẻ ca-rô xanh đen truyền thống, đồng phục Sát Quỷ Đoàn màu đen, xà cạp bắp chân, khuyên tai Hanafuda và tóc giả màu đỏ thẫm.',
      price: 140000,
      deposit: 400000,
      images: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-TANJIRO-M', qty: 3 },
        { size: 'L', sku: 'CR-TANJIRO-L', qty: 3 },
        { size: 'XL', sku: 'CR-TANJIRO-XL', qty: 2 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Kochou Shinobu - Trùng Trụ',
      slug: 'kochou-shinobu-demonslayer',
      character: 'Kochou Shinobu',
      series: 'Kimetsu no Yaiba',
      desc: 'Haori họa tiết cánh bướm chuyển sắc tím hồng tinh tế, kẹp tóc bướm tím lam, đồng phục Sát Quỷ Đoàn dáng nữ và kiếm Nhật bọc da cao cấp.',
      price: 160000,
      deposit: 500000,
      images: [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-SHINOBU-S', qty: 2 },
        { size: 'M', sku: 'CR-SHINOBU-M', qty: 3 },
      ],
    },
    {
      cat: 'game-cosplay',
      name: 'KafKa - Honkai: Star Rail',
      slug: 'kafka-honkai-star-rail',
      character: 'Kafka',
      series: 'Honkai: Star Rail',
      desc: 'Áo khoác da đen dáng dài viền chỉ mạng nhện tím, áo sơ mi trắng cổ thắt nơ đỏ, quần short da, kính râm phong cách và tóc giả tím hồng quý phái.',
      price: 210000,
      deposit: 650000,
      images: [
        'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-KAFKA-M', qty: 3 },
        { size: 'L', sku: 'CR-KAFKA-L', qty: 2 },
      ],
    },
    {
      cat: 'game-cosplay',
      name: 'Ruan Mei - Nhà Khoa Học Thiên Tài',
      slug: 'ruan-mei-honkai-star-rail',
      character: 'Ruan Mei',
      series: 'Honkai: Star Rail',
      desc: 'Sườn xám cách tân lụa the xanh ngọc đính cành mai kim loại, áo khoác choàng voan thêu, trâm cài tóc hoa mai và phụ kiện đàn tỳ bà phong cách sci-fi.',
      price: 230000,
      deposit: 700000,
      images: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-RUANMEI-S', qty: 2 },
        { size: 'M', sku: 'CR-RUANMEI-M', qty: 2 },
      ],
    },
    {
      cat: 'co-phong-hanfu',
      name: 'Hán Phục Thần Tiên Nữ - Tuyết Dạ',
      slug: 'han-phuc-thuyet-da',
      character: 'Tiên Nữ Cổ Phong',
      series: 'Nguyên Bản Cổ Trang',
      desc: 'Hán phục đại tụ sam 6 mét xòe thêu hạc tiên kim tuyến lộng lẫy, dải lụa thắt eo ombre xanh băng tuyết, tặng kèm trâm ngọc và quạt tròn cổ trang.',
      price: 180000,
      deposit: 600000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
      ],
      variants: [
        { size: 'FreeSize', sku: 'CR-HANFU-01', qty: 4 },
      ],
    },
    {
      cat: 'co-phong-hanfu',
      name: 'Lam Vong Cơ - Ma Đạo Tổ Sư',
      slug: 'lam-vong-co-lan-wangji',
      character: 'Lam Vong Cơ (Hàm Quang Quân)',
      series: 'Ma Đạo Tổ Sư (Trần Tình Lệnh)',
      desc: 'Bạch y thanh tao thêu vân lôi Cô Tô Lam Thị, mạt ngạch đính mây bạc, đai lưng ngọc bội, kèm tóc giả dài buộc búi trâm bạc cao cấp.',
      price: 220000,
      deposit: 700000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-LAN-M', qty: 2 },
        { size: 'L', sku: 'CR-LAN-L', qty: 3 },
      ],
    },
    {
      cat: 'co-phong-hanfu',
      name: 'Ngụy Vô Tiện - Di Lăng Lão Tổ',
      slug: 'nguy-vo-tien-wei-wuxian',
      character: 'Ngụy Vô Tiện',
      series: 'Ma Đạo Tổ Sư',
      desc: 'Hắc y viền đỏ phóng khoáng, đai da thắt eo, dây buộc tóc đỏ rực, tặng kèm sáo Trần Tình đen bóng buộc tua rua đỏ.',
      price: 200000,
      deposit: 600000,
      images: [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-WEI-M', qty: 3 },
        { size: 'L', sku: 'CR-WEI-L', qty: 3 },
      ],
    },
    {
      cat: 'sieu-anh-hung',
      name: 'Spider-Man Suit - Miles Morales',
      slug: 'spider-man-miles-morales',
      character: 'Miles Morales',
      series: 'Marvel Spider-Man',
      desc: 'Bộ đồ thun spandex co giãn 4 chiều in 3D họa tiết mạng nhện đỏ trên nền đen bóng, mặt nạ mắt lưới thoáng khí nhìn rõ bên ngoài.',
      price: 160000,
      deposit: 500000,
      images: [
        'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-SPIDER-M', qty: 3 },
        { size: 'L', sku: 'CR-SPIDER-L', qty: 3 },
      ],
    },
    {
      cat: 'sieu-anh-hung',
      name: 'Deadpool - Trang Phục Chiến Thuật',
      slug: 'deadpool-tactical-suit',
      character: 'Wade Wilson (Deadpool)',
      series: 'Marvel Deadpool',
      desc: 'Jumpsuit da PU cao cấp đỏ đen phối chi tiết giáp gối, đai lưng gắn bao đạn và bao kiếm kép sau lưng (bao gồm 2 kiếm katana đạo cụ).',
      price: 250000,
      deposit: 800000,
      images: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-DP-M', qty: 2 },
        { size: 'L', sku: 'CR-DP-L', qty: 3 },
        { size: 'XL', sku: 'CR-DP-XL', qty: 2 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Saber Artoria Pendragon - Fate/Stay Night',
      slug: 'saber-artoria-pendragon',
      character: 'Artoria Pendragon (Saber)',
      series: 'Fate/stay night',
      desc: 'Váy đầm xanh hoàng gia lót giáp ngực và giáp vai sáng bóng, váy lót ren trắng xòe bồng bềnh, tóc giả vàng búi tỏi kèm ruy băng xanh.',
      price: 240000,
      deposit: 750000,
      images: [
        'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-SABER-S', qty: 2 },
        { size: 'M', sku: 'CR-SABER-M', qty: 3 },
        { size: 'L', sku: 'CR-SABER-L', qty: 1 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Gojo Satoru - Đồng Phục Cao Chuyên Jujutsu',
      slug: 'gojo-satoru-jujutsu-kaisen',
      character: 'Gojo Satoru',
      series: 'Jujutsu Kaisen',
      desc: 'Áo khoác cổ cao tối màu cúc xoắn Tokyo Jujutsu, quần âu ống suông, bịt mắt vải nhung đen co giãn và tóc giả bạch kim vuốt dựng.',
      price: 150000,
      deposit: 450000,
      images: [
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
        'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-GOJO-M', qty: 3 },
        { size: 'L', sku: 'CR-GOJO-L', qty: 4 },
        { size: 'XL', sku: 'CR-GOJO-XL', qty: 2 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Geto Suguru - Trang Phục Pháp Sư Khăn Xếp',
      slug: 'geto-suguru-jujutsu-kaisen',
      character: 'Geto Suguru',
      series: 'Jujutsu Kaisen',
      desc: 'Áo ca-sa vàng kim phối đen thần bí, quần thụng hakama rộng, tóc giả đen dài búi cao có lọn tóc rủ trán đặc trưng.',
      price: 160000,
      deposit: 450000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
      ],
      variants: [
        { size: 'M', sku: 'CR-GETO-M', qty: 2 },
        { size: 'L', sku: 'CR-GETO-L', qty: 3 },
      ],
    },
    {
      cat: 'game-cosplay',
      name: 'Ahri Cửu Vĩ Linh Hồ - Liên Minh Huyền Thoại',
      slug: 'ahri-cuu-vi-linh-ho',
      character: 'Ahri',
      series: 'League of Legends',
      desc: 'Váy ngắn Hanbok cách tân trắng đỏ viền vàng hoàng gia, tay áo rộng xẻ tà, bờm tai cáo nhung mềm và bộ 9 đuôi hồ ly khung mềm gắn thắt lưng.',
      price: 260000,
      deposit: 850000,
      images: [
        'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=800',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-AHRI-S', qty: 2 },
        { size: 'M', sku: 'CR-AHRI-M', qty: 3 },
      ],
    },
    {
      cat: 'anime-manga',
      name: 'Marin Kitagawa - Nữ Sinh Shizuku-tan',
      slug: 'marin-kitagawa-shizuku',
      character: 'Marin Kitagawa',
      series: 'My Dress-Up Darling',
      desc: 'Váy dạ hội gothic lolita nhung đen phối tím thêu ren cầu kỳ, tạp dề ren trắng, choker cổ gắn thánh giá và tóc giả tím highlight đen.',
      price: 190000,
      deposit: 600000,
      images: [
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
      ],
      variants: [
        { size: 'S', sku: 'CR-MARIN-S', qty: 2 },
        { size: 'M', sku: 'CR-MARIN-M', qty: 3 },
      ],
    },
  ];

  const variantList: CostumeVariant[] = [];

  for (const def of costumeDefs) {
    let costume = await costumeRepo.findOne({ where: { slug: def.slug } });
    const cat = catMap.get(def.cat)!;

    if (costume) {
      // Đảm bảo cập nhật toàn bộ ảnh sang bộ ảnh chuẩn mới nhất
      await imageRepo.delete({ costumeId: costume.id });
      for (let i = 0; i < def.images.length; i++) {
        const img = imageRepo.create({
          costumeId: costume.id,
          imageUrl: def.images[i],
          altText: `${def.name} - Ảnh ${i + 1}`,
          isPrimary: i === 0,
          displayOrder: i,
        });
        await imageRepo.save(img);
      }
    }

    if (!costume) {
      costume = costumeRepo.create({
        categoryId: cat.id,
        name: def.name,
        slug: def.slug,
        characterName: def.character,
        seriesName: def.series,
        description: def.desc,
        dailyPrice: def.price,
        depositAmount: def.deposit,
        isActive: true,
      });
      costume = await costumeRepo.save(costume);

      // Save images
      for (let i = 0; i < def.images.length; i++) {
        const img = imageRepo.create({
          costumeId: costume.id,
          imageUrl: def.images[i],
          altText: `${def.name} - Ảnh ${i + 1}`,
          isPrimary: i === 0,
          displayOrder: i,
        });
        await imageRepo.save(img);
      }

      // Save variants
      for (const vDef of def.variants) {
        let v = await variantRepo.findOne({ where: { sku: vDef.sku } });
        if (!v) {
          v = variantRepo.create({
            costumeId: costume.id,
            size: vDef.size,
            sku: vDef.sku,
            totalQuantity: vDef.qty,
            outOfServiceQuantity: 0,
          });
          v = await variantRepo.save(v);
        }
        variantList.push(v);
      }
    }
  }
  console.log(`✓ Đã nạp ${costumeDefs.length} trang phục cosplay phong phú.`);

  // 4. Seed Demo Orders across various statuses:
  // - PENDING (upcoming)
  // - CONFIRMED (upcoming)
  // - RENTING (active)
  // - RENTING (OVERDUE to test overdue reserve logic)
  // - RETURNED (completed)
  // - CANCELLED
  const existingOrders = await orderRepo.count();
  if (existingOrders === 0 && variantList.length >= 5) {
    const v1 = variantList[0]; // Raiden Shogun S
    const v2 = variantList[1]; // Raiden Shogun M
    const v3 = variantList[3]; // Anya S
    const v4 = variantList[6]; // Frieren M
    const v5 = variantList[9]; // Furina S

    // 4.1 Order PENDING: Khách đặt thuê tuần tới
    const orderPending = orderRepo.create({
      orderCode: 'CR-20261110-1001',
      userId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      note: 'Nhận đồ buổi chiều sau 15h',
      status: OrderStatus.PENDING,
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      rentalDays: 3,
      totalRentalFee: 600000,
      totalDeposit: 600000,
      actualDepositReturned: 0,
    });
    const savedPending = await orderRepo.save(orderPending);
    await orderItemRepo.save(
      orderItemRepo.create({
        rentalOrderId: savedPending.id,
        costumeVariantId: v2.id,
        costumeNameSnapshot: 'Raiden Shogun - Genshin Impact',
        sizeSnapshot: v2.size,
        dailyPriceSnapshot: 200000,
        depositSnapshot: 600000,
        quantity: 1,
        lineRentalFee: 600000,
        lineDeposit: 600000,
      }),
    );
    await historyRepo.save(
      historyRepo.create({
        rentalOrderId: savedPending.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedById: customer1.id,
        changedByName: customer1.fullName,
        note: 'Khách hàng tạo đơn thuê',
      }),
    );

    // 4.2 Order CONFIRMED: Đã duyệt, chờ khách tới lấy
    const orderConfirmed = orderRepo.create({
      orderCode: 'CR-20261105-2002',
      userId: customer2.id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      note: 'Đi fes Manga chiều thứ 7',
      status: OrderStatus.CONFIRMED,
      startDate: '2026-11-05',
      endDate: '2026-11-07',
      rentalDays: 3,
      totalRentalFee: 360000,
      totalDeposit: 400000,
      actualDepositReturned: 0,
    });
    const savedConfirmed = await orderRepo.save(orderConfirmed);
    await orderItemRepo.save(
      orderItemRepo.create({
        rentalOrderId: savedConfirmed.id,
        costumeVariantId: v3.id,
        costumeNameSnapshot: 'Anya Forger - SPY x FAMILY',
        sizeSnapshot: v3.size,
        dailyPriceSnapshot: 120000,
        depositSnapshot: 400000,
        quantity: 1,
        lineRentalFee: 360000,
        lineDeposit: 400000,
      }),
    );
    await historyRepo.save(
      historyRepo.create({
        rentalOrderId: savedConfirmed.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CONFIRMED,
        changedById: admin.id,
        changedByName: admin.fullName,
        note: 'Admin xác nhận đơn thuê',
      }),
    );

    // 4.3 Order RENTING: Khách đang cầm đồ đi chụp ảnh
    const orderRenting = orderRepo.create({
      orderCode: 'CR-20261028-3003',
      userId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      status: OrderStatus.RENTING,
      startDate: '2026-10-28',
      endDate: '2026-10-30',
      rentalDays: 3,
      totalRentalFee: 540000,
      totalDeposit: 500000,
      deliveredAt: new Date(),
    });
    const savedRenting = await orderRepo.save(orderRenting);
    await orderItemRepo.save(
      orderItemRepo.create({
        rentalOrderId: savedRenting.id,
        costumeVariantId: v4.id,
        costumeNameSnapshot: 'Frieren - Pháp Sư Tiễn Biệt',
        sizeSnapshot: v4.size,
        dailyPriceSnapshot: 180000,
        depositSnapshot: 500000,
        quantity: 1,
        lineRentalFee: 540000,
        lineDeposit: 500000,
      }),
    );

    // 4.4 Order RENTING QUÁ HẠN (Overdue): startDate & endDate trong quá khứ nhưng chưa trả!
    const orderOverdue = orderRepo.create({
      orderCode: 'CR-20261020-4004',
      userId: customer2.id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      note: 'Khách xin gia hạn thêm 1 ngày nhưng chưa mang trả',
      status: OrderStatus.RENTING,
      startDate: '2026-10-20',
      endDate: '2026-10-22', // Overdue relative to current time
      rentalDays: 3,
      totalRentalFee: 660000,
      totalDeposit: 700000,
      deliveredAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    });
    const savedOverdue = await orderRepo.save(orderOverdue);
    await orderItemRepo.save(
      orderItemRepo.create({
        rentalOrderId: savedOverdue.id,
        costumeVariantId: v5.id,
        costumeNameSnapshot: 'Furina - Thần Nước Fontaine',
        sizeSnapshot: v5.size,
        dailyPriceSnapshot: 220000,
        depositSnapshot: 700000,
        quantity: 1,
        lineRentalFee: 660000,
        lineDeposit: 700000,
      }),
    );

    // 4.5 Order RETURNED: Đơn đã hoàn tất trả đồ và hoàn cọc
    const orderReturned = orderRepo.create({
      orderCode: 'CR-20261015-5005',
      userId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      status: OrderStatus.RETURNED,
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      rentalDays: 2,
      totalRentalFee: 400000,
      totalDeposit: 600000,
      actualDepositReturned: 600000,
      deliveredAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      returnedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000),
    });
    const savedReturned = await orderRepo.save(orderReturned);
    await orderItemRepo.save(
      orderItemRepo.create({
        rentalOrderId: savedReturned.id,
        costumeVariantId: v1.id,
        costumeNameSnapshot: 'Raiden Shogun - Genshin Impact',
        sizeSnapshot: v1.size,
        dailyPriceSnapshot: 200000,
        depositSnapshot: 600000,
        quantity: 1,
        lineRentalFee: 400000,
        lineDeposit: 600000,
      }),
    );

    console.log('✓ Đã tạo các đơn hàng mẫu ở đầy đủ các trạng thái (PENDING, CONFIRMED, RENTING, OVERDUE, RETURNED).');
  }

  console.log('--- HOÀN TẤT NẠP DỮ LIỆU SEED THÀNH CÔNG ---');
}

if (require.main === module) {
  AppDataSource.initialize()
    .then(async (ds) => {
      await runSeed(ds);
      await ds.destroy();
    })
    .catch((err) => {
      console.error('Lỗi khi nạp dữ liệu seed:', err);
      process.exit(1);
    });
}

