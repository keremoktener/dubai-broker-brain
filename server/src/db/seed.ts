import { getDb } from './database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = getDb();

  const hashedPassword = await bcrypt.hash('dubai2024!', 12);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('admin@dubaibrokerbrain.com', hashedPassword, 'Admin User', 'admin');
  insertUser.run('agent@dubaibrokerbrain.com', hashedPassword, 'Sarah Al-Mansouri', 'agent');

  const insertMarket = db.prepare(`
    INSERT OR IGNORE INTO market_data (date, area, property_type, price_per_sqft, transactions, avg_price, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const areas = ['Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay', 'JBR', 'DIFC', 'Dubai Hills'];
  const basePrices = [2800, 2200, 4500, 1900, 2600, 3200, 1600];
  const types = ['Apartment', 'Villa', 'Penthouse', 'Townhouse'];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    areas.forEach((area, aIdx) => {
      const variance = (Math.random() - 0.5) * 200;
      const pricePerSqft = basePrices[aIdx] + variance;
      const transactions = Math.floor(Math.random() * 45) + 10;
      const avgPrice = pricePerSqft * (Math.random() * 600 + 800);
      const volume = avgPrice * transactions;

      insertMarket.run(
        dateStr,
        area,
        types[Math.floor(Math.random() * types.length)],
        Math.round(pricePerSqft * 100) / 100,
        transactions,
        Math.round(avgPrice),
        Math.round(volume),
      );
    });
  }

  const insertLead = db.prepare(`
    INSERT OR IGNORE INTO leads (name, email, phone, budget, interest, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const mockLeads: [string, string, string, number, string, string][] = [
    ['Mohammed Al-Rashid', 'mrashid@gmail.com', '+971501234567', 5000000, 'Palm Jumeirah Villa', 'hot'],
    ['Elena Petrov', 'epetrov@yahoo.com', '+971507654321', 2500000, 'Downtown Apartment', 'warm'],
    ['James Wellington', 'jwellington@outlook.com', '+971509876543', 8000000, 'DIFC Penthouse', 'new'],
    ['Aisha Hassan', 'ahassan@hotmail.com', '+971501357924', 1800000, 'Business Bay Apartment', 'warm'],
    ['Carlos Mendez', 'cmendez@gmail.com', '+971502468135', 3500000, 'Dubai Marina', 'hot'],
  ];

  mockLeads.forEach(lead => insertLead.run(...lead));

  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seed().catch(console.error);
