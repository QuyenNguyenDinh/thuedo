import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CostumesModule } from './modules/costumes/costumes.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'apps/backend/.env'),
        path.resolve(__dirname, '../../../../.env'), // monorepo root when compiled in dist/src
        path.resolve(__dirname, '../../../.env'),    // monorepo root when in src
        path.resolve(__dirname, '../../.env'),       // apps/backend/.env when compiled in dist/src
        path.resolve(__dirname, '../.env'),          // apps/backend/.env when in src
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawTtl = Number(config.get('THROTTLE_TTL')) || 60000;
        // Throttler v5+ TTL tính bằng mili-giây: nếu cấu hình <= 300 (giây), quy đổi sang ms
        const ttlMs = rawTtl <= 300 ? rawTtl * 1000 : rawTtl;
        return [
          {
            ttl: ttlMs,
            limit: Number(config.get('THROTTLE_LIMIT')) || 100,
          },
        ];
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        let host = config.get<string>('DB_HOST', 'localhost');
        let port = parseInt(config.get<string>('DB_PORT', '5432'), 10);
        let username = config.get<string>('DB_USERNAME', 'postgres');
        let password = config.get<string>('DB_PASSWORD', 'postgres_password_example');
        let database = config.get<string>('DB_DATABASE', 'cosrent_db');

        if (dbUrl) {
          try {
            const parsed = new URL(dbUrl);
            host = parsed.hostname || host;
            port = parsed.port ? parseInt(parsed.port, 10) : port;
            username = parsed.username || username;
            password = decodeURIComponent(parsed.password || password);
            database = (parsed.pathname ? parsed.pathname.slice(1) : database) || database;
          } catch (e) {
            // fallback
          }
        }

        const isCloudDb =
          config.get<string>('DB_SSL') === 'true' ||
          (dbUrl &&
            (dbUrl.includes('neon.tech') ||
              dbUrl.includes('supabase.co') ||
              dbUrl.includes('render.com') ||
              dbUrl.includes('railway.app') ||
              dbUrl.includes('aivencloud.com') ||
              dbUrl.includes('aiven.io') ||
              dbUrl.includes('sslmode=require'))) ||
          host.includes('neon.tech') ||
          host.includes('supabase.co') ||
          host.includes('render.com') ||
          host.includes('railway.app') ||
          host.includes('aivencloud.com') ||
          host.includes('aiven.io');

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          ssl: isCloudDb ? { rejectUnauthorized: false } : false,
          extra: isCloudDb ? { ssl: { rejectUnauthorized: false } } : undefined,
          autoLoadEntities: true,
          synchronize: false, // Strict migration requirement
        };
      },
      dataSourceFactory: async (options) => {
        const anyOptions = options as any;
        const dbHost = process.env.DB_HOST || anyOptions?.host;
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction && dbHost === 'memory') {
          console.error('❌ Môi trường PRODUCTION tuyệt đối không được sử dụng DB_HOST=memory!');
          throw new Error(
            'Cấu hình không hợp lệ: DB_HOST=memory bị cấm hoàn toàn trong môi trường production.',
          );
        }

        if (dbHost === 'memory') {
          const { createMemoryDataSource } = await import('./database/memory-data-source');
          return createMemoryDataSource();
        }
        const { DataSource } = await import('typeorm');
        const ds = new DataSource(options!);
        try {
          return await ds.initialize();
        } catch (err: any) {
          if (process.env.NODE_ENV === 'production') {
            console.error(
              '❌ Môi trường PRODUCTION yêu cầu cơ sở dữ liệu PostgreSQL thực tế đang hoạt động!',
            );
            console.error(`Chi tiết lỗi kết nối: ${err?.message || err}`);
            throw err;
          }
          if (
            err?.code === 'ECONNREFUSED' ||
            err?.name === 'AggregateError' ||
            (err?.message && err.message.includes('ECONNREFUSED'))
          ) {
            console.warn(
              `⚠️ Không kết nối được PostgreSQL tại ${anyOptions?.host}:${anyOptions?.port}.`,
            );
            console.warn(
              '⚡ Tự động kích hoạt In-Memory PostgreSQL (pg-mem) kèm nạp toàn bộ Seed Data để khởi chạy ứng dụng!',
            );
            const { createMemoryDataSource } = await import('./database/memory-data-source');
            return createMemoryDataSource();
          }
          throw err;
        }
      },
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    CostumesModule,
    PricingModule,
    AvailabilityModule,
    RentalsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

