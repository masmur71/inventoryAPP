import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const connectTestDB = async () => {
  // Ganti nama DB agar aman
  const dbName = 'inventory_test_db';
  const testURI = config.MONGO_URI.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testURI);
  }

  // --- SMART MOCK SESSION ---
  // Cek flag agar tidak mock double (idempotent)
  if (!(mongoose.startSession as any)._isMocked) {
    
    // 1. Simpan fungsi asli
    const originalStartSession = mongoose.startSession.bind(mongoose);

    // 2. Override fungsi startSession
    mongoose.startSession = async (options?: any) => {
      // Panggil fungsi asli: Kita dapat object Session yang VALID dan LENGKAP
      // (MongoDB Standalone support session, cuma gak support multi-doc transaction)
      const session = await originalStartSession(options);

      // 3. Stubbing: Matikan fungsi transaksi
      // Saat service memanggil .startTransaction(), kode ini yang jalan (bukan kirim perintah ke DB)
      session.startTransaction = () => {}; 
      session.commitTransaction = async () => {};
      session.abortTransaction = async () => {};
      
      // endSession biarkan asli, aman.
      return session;
    };

    // Tandai sudah dimock
    (mongoose.startSession as any)._isMocked = true;
  }
};

export const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
};

export const clearCollections = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      // Pastikan collection ada sebelum delete
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
};