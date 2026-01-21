import request from 'supertest';
import app from '../app.js';
import { connectTestDB, closeTestDB, clearCollections } from './setup.js';
import redis from '../config/redis.js';

// --- SETUP & TEARDOWN ---

beforeAll(async () => {
  await connectTestDB();
});

// afterEach(async () => {
//   await clearCollections();
// });

afterAll(async () => {
  await closeTestDB();
  redis.disconnect(); // Tutup koneksi Redis
});

// --- TEST SCENARIO ---

describe('End-to-End Transaction Flow', () => {

  // Helper variables untuk menyimpan state antar step
  let token: string;
  let warehouseId: string;
  let productId: string;

  it('Step 1: Prepare System (Seed Roles)', async () => {
    // KITA HARUS MEMBUAT ROLE DULU AGAR REGISTER TIDAK ERROR 500
    const { Role } = await import('../modules/users/models/role.model.js');
    
    await Role.create([
      { name: 'admin', permissions: ['all'] },
      { name: 'staff', permissions: ['order.create', 'order.view'] } // Role default untuk user baru
    ]);
  });

  it('Step 2: Register & Login Super Admin', async () => {
    // 1. Register User Baru (Otomatis jadi 'staff' karena logic service kita)
    const regRes = await request(app).post('/api/auth/register').send({
      fullName: 'Super Admin',
      email: 'super@test.com',
      password: 'password123'
    });
    
    // Debugging: Jika error, print body-nya
    if (regRes.status !== 201) {
      console.error('Register Error:', regRes.body);
    }
    expect(regRes.status).toBe(201);

    // 2. Manual Upgrade ke 'admin' (Karena kita butuh permission 'all' untuk setup data)
    const { User } = await import('../modules/users/models/user.model.js');
    const { Role } = await import('../modules/users/models/role.model.js');
    const adminRole = await Role.findOne({ name: 'admin' });
    
    await User.findOneAndUpdate(
      { email: 'super@test.com' }, 
      { role: adminRole?._id }
    );

    // 3. Login untuk dapat Token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'super@test.com',
      password: 'password123'
    });

    expect(loginRes.status).toBe(200);
    token = loginRes.body.data.accessToken; // Simpan token untuk step selanjutnya
    expect(token).toBeDefined();
  });

  it('Step 3: Create Master Data (Warehouse & Product)', async () => {
    // Create Warehouse
    const whRes = await request(app).post('/api/inventory/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        code: 'WH-01', 
        name: 'Gudang Pusat', 
        address: 'Jakarta' 
      });
    expect(whRes.status).toBe(201);
    warehouseId = whRes.body.data._id;

    // Create Product
    const prodRes = await request(app).post('/api/inventory/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        sku: 'LAPTOP-001', 
        name: 'MacBook Pro M3', 
        price: 25000000 
      });
    expect(prodRes.status).toBe(201);
    productId = prodRes.body.data._id;
  });

  it('Step 4: Stock Adjustment (IN)', async () => {
    // Tambah stok 10 unit
    const res = await request(app).post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        warehouseId,
        quantity: 10,
        type: 'IN',
        reason: 'PURCHASE',
        notes: 'Initial Stock'
      });
    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(10);
  });

  it('Step 5: Create Order (Buy 2 items)', async () => {
    // Beli 2 unit
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        warehouseId,
        customerName: 'Sultan Buyer',
        items: [{ productId, quantity: 2 }]
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(50000000); // 25jt * 2
  });

  it('Step 6: Verification (Check Final Stock)', async () => {
    // Cek stok harus sisa 8 (10 - 2)
    // Kita gunakan endpoint GET stock per warehouse
    // (Pastikan Anda sudah membuat endpoint ini di inventory controller, jika belum kita pakai DB check langsung)
    
    // Cara 1: Via API (Ideal)
    // const res = await request(app).get(`/api/inventory/stock/${warehouseId}`)
    //   .set('Authorization', `Bearer ${token}`);
    // const item = res.body.data.find((s: any) => s.product._id === productId);
    // expect(item.quantity).toBe(8);

    // Cara 2: Via Direct DB Access (Fail-safe untuk test)
    const { Stock } = await import('../modules/inventory/models/stock.model.js');
    const stock = await Stock.findOne({ warehouse: warehouseId, product: productId });
    expect(stock).not.toBeNull();
    expect(stock?.quantity).toBe(8);
  });

});