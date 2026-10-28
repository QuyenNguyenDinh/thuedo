import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // 1. Security Headers with Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          imgSrc: [`'self'`, 'data:', 'https:', 'blob:'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'https:'],
        },
      },
    }),
  );

  // 2. Cookie Parser for HttpOnly Refresh Token
  const cookieMiddleware = (cookieParser as any).default || cookieParser;
  app.use(cookieMiddleware());

  // 3. CORS Configuration from Config
  const corsOrigins = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173,http://127.0.0.1:5173',
  );
  const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Nguồn CORS không được phép: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  });

  // 4. Global API Prefix
  app.setGlobalPrefix('api/v1');

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 6. Global Exception Filter & Transform Interceptor
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 7. Swagger / OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CosRent API – Hệ Thống Cho Thuê Trang Phục Cosplay')
    .setDescription(
      'Tài liệu OpenAPI chính thức của hệ thống CosRent. Hỗ trợ xác thực kép: Bearer JWT Access Token và HttpOnly Cookie Refresh Token.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token được cấp sau khi đăng nhập (Bearer <token>)',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Đăng ký, Đăng nhập, Refresh Token, Đăng xuất')
    .addTag('Users', 'Quản lý thông tin hồ sơ cá nhân')
    .addTag('Categories', 'Danh mục trang phục')
    .addTag('Costumes', 'Xem và tìm kiếm trang phục cosplay')
    .addTag('Availability', 'Kiểm tra lịch tồn kho khả dụng theo khoảng ngày')
    .addTag('Rental Quotes', 'Bảng tính tiền thuê và tiền cọc')
    .addTag('Rentals (Customer)', 'Tạo đơn đặt giữ chỗ và quản lý đơn của tôi')
    .addTag('Admin Categories', 'Quản trị danh mục trang phục')
    .addTag('Admin Costumes', 'Quản trị trang phục và ẩn/hiện sản phẩm')
    .addTag('Admin Variants & Inventory', 'Quản trị kích cỡ và số lượng tồn kho an toàn')
    .addTag('Admin Rentals', 'Duyệt, từ chối, giao và nhận trả đồ tại quầy')
    .addTag('Admin Dashboard', 'Thống kê tổng quan hoạt động kinh doanh')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 CosRent Backend đang chạy tại: http://localhost:${port}`);
  logger.log(`📚 Swagger UI tài liệu API: http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}
bootstrap();

