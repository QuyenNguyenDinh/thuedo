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
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../.env'),
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres_password_example'),
        database: config.get<string>('DB_DATABASE', 'cosrent_db'),
        autoLoadEntities: true,
        synchronize: false, // Strict migration requirement
      }),
      dataSourceFactory: async (options) => {
        const anyOptions = options as any;
        const dbHost = process.env.DB_HOST || anyOptions?.host;
        if (dbHost === 'memory') {
          const { createMemoryDataSource } = await import('./database/memory-data-source');
          return createMemoryDataSource();
        }
        const { DataSource } = await import('typeorm');
        const ds = new DataSource(options!);
        try {
          return await ds.initialize();
        } catch (err: any) {
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

