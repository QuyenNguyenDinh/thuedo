import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Costume } from '../entities/costume.entity';
import { CostumeVariant } from '../entities/costume-variant.entity';
import { CostumeImage } from '../entities/costume-image.entity';
import { RentalOrder } from '../entities/rental-order.entity';
import { RentalOrderItem } from '../entities/rental-order-item.entity';
import { RentalStatusHistory } from '../entities/rental-status-history.entity';
import { RefreshSession } from '../entities/refresh-session.entity';
import { runSeed } from './seeds/seed';

export async function createMemoryDataSource(): Promise<DataSource> {
  console.log('⚡ Đang khởi tạo In-Memory PostgreSQL Database (pg-mem) cho môi trường dev không có Docker/Postgres...');
  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'cosrent_db',
  });
  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 16.0 on x86_64-pc-windows-msvc',
  });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    impure: true,
    implementation: () => require('crypto').randomUUID(),
  });
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    impure: true,
    implementation: () => require('crypto').randomUUID(),
  });

  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [
      User,
      Category,
      Costume,
      CostumeVariant,
      CostumeImage,
      RentalOrder,
      RentalOrderItem,
      RentalStatusHistory,
      RefreshSession,
    ],
    synchronize: true,
  });

  await ds.initialize();
  console.log('✓ In-Memory PostgreSQL initialized successfully!');

  // Tự động nạp dữ liệu mẫu
  try {
    await runSeed(ds);
    console.log('✓ Seeded in-memory data successfully!');
  } catch (err) {
    console.error('Lỗi khi nạp seed trong memory db:', err);
  }

  return ds;
}
