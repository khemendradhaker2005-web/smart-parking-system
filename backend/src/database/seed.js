const bcrypt = require('bcryptjs');
const { query, initDatabase } = require('./db');
const { initSchema } = require('./initSchema');

async function seed() {
  console.log('[Seed] Starting database migration & seeding...');
  await initDatabase();
  await initSchema();

  // Safe check: Only seed initial demo accounts if users table is empty
  const existingUsers = await query("SELECT COUNT(*) as count FROM users;");
  const count = parseInt(existingUsers.rows[0]?.count || 0, 10);

  if (count > 0) {
    console.log(`[Seed] Database already contains ${count} user record(s). Skipping seed.`);
    return;
  }

  console.log('[Seed] Seeding authorized staff and demo customers...');
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password@123', salt);

  // 1. Seed Staff Users
  await query(
    `INSERT INTO users (full_name, mobile, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Rajesh Sharma (Shift Supervisor)', '9876543210', 'rajesh.staff@smartparking.io', commonPasswordHash, 'staff']
  );
  await query(
    `INSERT INTO users (full_name, mobile, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Pooja Verma (Gate Operator)', '9876543211', 'pooja.staff@smartparking.io', commonPasswordHash, 'staff']
  );

  // 2. Seed Customer Users
  await query(
    `INSERT INTO users (full_name, mobile, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Arun Kumar', '9123456780', 'arun.kumar@gmail.com', commonPasswordHash, 'customer']
  );
  await query(
    `INSERT INTO users (full_name, mobile, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ['Neha Patel', '9876501234', 'neha.patel@outlook.com', commonPasswordHash, 'customer']
  );

  // Retrieve dynamically created user IDs to avoid hardcoded sequence assumptions
  const arunUserRes = await query("SELECT id FROM users WHERE mobile = '9123456780'");
  const nehaUserRes = await query("SELECT id FROM users WHERE mobile = '9876501234'");
  const rajeshUserRes = await query("SELECT id FROM users WHERE mobile = '9876543210'");
  const poojaUserRes = await query("SELECT id FROM users WHERE mobile = '9876543211'");

  const arunId = arunUserRes.rows[0]?.id || 3;
  const nehaId = nehaUserRes.rows[0]?.id || 4;
  const rajeshId = rajeshUserRes.rows[0]?.id || 1;
  const poojaId = poojaUserRes.rows[0]?.id || 2;

  // 3. Seed Vehicles
  await query(
    `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, make_model, is_primary) VALUES ($1, $2, $3, $4, $5)`,
    [arunId, 'KA01AB1234', 'Four Wheeler / Car', 'Honda City (Pearl White)', true]
  );
  await query(
    `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, make_model, is_primary) VALUES ($1, $2, $3, $4, $5)`,
    [arunId, 'KA05EV4321', 'EV / Electric Vehicle', 'Tata Nexon EV (Teal Blue)', false]
  );
  await query(
    `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, make_model, is_primary) VALUES ($1, $2, $3, $4, $5)`,
    [nehaId, 'MH12CD5678', 'SUV', 'Hyundai Creta (Knight Black)', true]
  );

  // 4. Seed Parking Locations
  const locations = [
    {
      name: 'Cyber City Tech Park Parking',
      address: 'Phase 1, Electronic City, Hosur Road, Near Tech Hub Gate 3',
      city: 'Bangalore',
      latitude: 12.8452,
      longitude: 77.6602,
      total_slots: 24,
      price_per_hour: 20.00,
      rating: 4.85,
      operating_hours: '24/7 Open',
      contact_number: '+91 98765 43210',
      amenities: JSON.stringify(["CCTV Surveillance", "24/7 Security", "EV Fast Charging", "Covered Parking", "Valet Assistance"]),
      rules: JSON.stringify(["Speed limit: 10 km/h", "Park strictly within designated slot lines", "Mandatory entry scan", "Charges: ₹20/hr, minimum ₹20"]),
      image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Central Metro Plaza Parking',
      address: 'MG Road Metro Station Interchange, Brigade Road Junction',
      city: 'Bangalore',
      latitude: 12.9756,
      longitude: 77.6067,
      total_slots: 20,
      price_per_hour: 20.00,
      rating: 4.70,
      operating_hours: '05:30 AM - 11:30 PM',
      contact_number: '+91 98765 43212',
      amenities: JSON.stringify(["Direct Metro Access", "CCTV Surveillance", "Wheelchair Friendly", "Digital UPI Payment"]),
      rules: JSON.stringify(["Strict no idling zone", "Follow entry/exit arrow markings", "Charges: ₹20/hr, minimum ₹20"]),
      image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Phoenix Grand Mall Multilevel Parking',
      address: 'Whitefield Main Road, Mahadevapura, Near ITPL',
      city: 'Bangalore',
      latitude: 12.9972,
      longitude: 77.6968,
      total_slots: 24,
      price_per_hour: 20.00,
      rating: 4.90,
      operating_hours: '09:00 AM - 01:00 AM',
      contact_number: '+91 98765 43214',
      amenities: JSON.stringify(["Covered Multi-level", "Automated Boom Barriers", "EV Fast Charging", "Tyre Inflation Point", "Elevator Access"]),
      rules: JSON.stringify(["Max vehicle height: 2.2m", "Overnight parking prohibited without permit", "Charges: ₹20/hr, minimum ₹20"]),
      image_url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Airport Express Gateway Parking',
      address: 'Hebbal Flyover Junction, Outer Ring Road, Bellary Road',
      city: 'Bangalore',
      latitude: 13.0358,
      longitude: 77.5970,
      total_slots: 18,
      price_per_hour: 20.00,
      rating: 4.80,
      operating_hours: '24/7 Open',
      contact_number: '+91 98765 43216',
      amenities: JSON.stringify(["24/7 Security", "Shuttle Service Point", "Luggage Assistance", "CCTV High Definition", "Card & UPI"]),
      rules: JSON.stringify(["Commercial vehicles require pass", "Charges: ₹20/hr, minimum ₹20"]),
      image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const locIdMap = {};
  for (const loc of locations) {
    await query(
      `INSERT INTO parking_locations (name, address, city, latitude, longitude, total_slots, price_per_hour, rating, operating_hours, contact_number, amenities, rules, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [loc.name, loc.address, loc.city, loc.latitude, loc.longitude, loc.total_slots, loc.price_per_hour, loc.rating, loc.operating_hours, loc.contact_number, loc.amenities, loc.rules, loc.image_url]
    );
    const insertedLoc = await query('SELECT id FROM parking_locations WHERE name = $1', [loc.name]);
    locIdMap[loc.name] = insertedLoc.rows[0]?.id;
  }

  const cyberCityId = locIdMap['Cyber City Tech Park Parking'];
  const metroPlazaId = locIdMap['Central Metro Plaza Parking'];
  const phoenixMallId = locIdMap['Phoenix Grand Mall Multilevel Parking'];
  const airportGatewayId = locIdMap['Airport Express Gateway Parking'];

  // 5. Seed Parking Slots for each location
  const slotLayouts = [
    { locId: cyberCityId, prefix: 'A', count: 8, floor: 'Ground Floor', type: 'Standard' },
    { locId: cyberCityId, prefix: 'B', count: 8, floor: 'Basement 1', type: 'Standard' },
    { locId: cyberCityId, prefix: 'EV', count: 4, floor: 'Ground Floor', type: 'EV Charging' },
    { locId: cyberCityId, prefix: 'C', count: 4, floor: 'Basement 1', type: 'Accessible' },

    { locId: metroPlazaId, prefix: 'A', count: 10, floor: 'Level 1', type: 'Standard' },
    { locId: metroPlazaId, prefix: 'B', count: 8, floor: 'Level 2', type: 'Standard' },
    { locId: metroPlazaId, prefix: 'EV', count: 2, floor: 'Level 1', type: 'EV Charging' },

    { locId: phoenixMallId, prefix: 'A', count: 10, floor: 'Lower Deck', type: 'Standard' },
    { locId: phoenixMallId, prefix: 'B', count: 10, floor: 'Upper Deck', type: 'Standard' },
    { locId: phoenixMallId, prefix: 'EV', count: 4, floor: 'Lower Deck', type: 'EV Charging' },

    { locId: airportGatewayId, prefix: 'A', count: 10, floor: 'Ground Open', type: 'Standard' },
    { locId: airportGatewayId, prefix: 'B', count: 6, floor: 'Ground Covered', type: 'Standard' },
    { locId: airportGatewayId, prefix: 'EV', count: 2, floor: 'Ground Covered', type: 'EV Charging' },
  ];

  for (const layout of slotLayouts) {
    if (!layout.locId) continue;
    for (let i = 1; i <= layout.count; i++) {
      const slotNum = `${layout.prefix}-${String(i).padStart(2, '0')}`;
      await query(
        `INSERT INTO parking_slots (location_id, slot_number, floor_level, section, slot_type, status)
         VALUES ($1, $2, $3, $4, $5, 'available')`,
        [layout.locId, slotNum, layout.floor, layout.prefix, layout.type]
      );
    }
  }

  // Set one slot maintenance for realism
  if (cyberCityId) {
    await query(`UPDATE parking_slots SET status = 'maintenance' WHERE location_id = $1 AND slot_number = 'B-04'`, [cyberCityId]);
  }

  // Look up slot IDs for demo sessions
  const slotA01Res = await query('SELECT id FROM parking_slots WHERE location_id = $1 AND slot_number = $2', [cyberCityId, 'A-01']);
  const slotA01Id = slotA01Res.rows[0]?.id || 1;

  const slotMetroRes = await query('SELECT id FROM parking_slots WHERE location_id = $1 AND slot_number = $2', [metroPlazaId, 'A-01']);
  const slotMetroId = slotMetroRes.rows[0]?.id || 25;

  const slotMallRes = await query('SELECT id FROM parking_slots WHERE location_id = $1 AND slot_number = $2', [phoenixMallId, 'A-01']);
  const slotMallId = slotMallRes.rows[0]?.id || 45;

  // 6. Pre-seed a few completed past sessions for Arun & Neha
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayExit = new Date(yesterday.getTime() + 2 * 3600 * 1000 + 15 * 60 * 1000); // 2 hrs 15 mins -> ₹60

  await query(
    `INSERT INTO parking_sessions (session_code, user_id, vehicle_number, customer_name, customer_mobile, vehicle_type, location_id, slot_id, entry_time, exit_time, duration_minutes, total_amount, status, entry_staff_id, exit_staff_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      'PS-DEMO-001',
      arunId,
      'KA01AB1234',
      'Arun Kumar',
      '9123456780',
      'Four Wheeler / Car',
      cyberCityId,
      slotA01Id,
      yesterday.toISOString(),
      yesterdayExit.toISOString(),
      135,
      60.00,
      'completed',
      rajeshId,
      rajeshId,
      'Regular completed session'
    ]
  );

  const sess1Res = await query("SELECT id FROM parking_sessions WHERE session_code = 'PS-DEMO-001'");
  const sess1Id = sess1Res.rows[0]?.id || 1;

  await query(
    `INSERT INTO payments (session_id, user_id, amount, payment_method, transaction_id, payment_status, receipt_number, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [sess1Id, arunId, 60.00, 'UPI', 'TXN-YEST-982143', 'completed', 'RCP-202611-001', yesterdayExit.toISOString()]
  );

  // Session 2: Completed 3 days ago (70 min -> ₹40)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const threeDaysAgoExit = new Date(threeDaysAgo.getTime() + 70 * 60 * 1000);
  await query(
    `INSERT INTO parking_sessions (session_code, user_id, vehicle_number, customer_name, customer_mobile, vehicle_type, location_id, slot_id, entry_time, exit_time, duration_minutes, total_amount, status, entry_staff_id, exit_staff_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    ['PS-DEMO-002', arunId, 'KA01AB1234', 'Arun Kumar', '9123456780', 'Four Wheeler / Car', metroPlazaId, slotMetroId, threeDaysAgo.toISOString(), threeDaysAgoExit.toISOString(), 70, 40.00, 'completed', poojaId, poojaId]
  );

  const sess2Res = await query("SELECT id FROM parking_sessions WHERE session_code = 'PS-DEMO-002'");
  const sess2Id = sess2Res.rows[0]?.id || 2;

  await query(
    `INSERT INTO payments (session_id, user_id, amount, payment_method, transaction_id, payment_status, receipt_number, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [sess2Id, arunId, 40.00, 'UPI', 'TXN-3DAY-481902', 'completed', 'RCP-202611-002', threeDaysAgoExit.toISOString()]
  );

  // Session 3: Other vehicle completed
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 3600 * 1000);
  const fiveDaysAgoExit = new Date(fiveDaysAgo.getTime() + 45 * 60 * 1000); // 45 min -> ₹20
  await query(
    `INSERT INTO parking_sessions (session_code, user_id, vehicle_number, customer_name, customer_mobile, vehicle_type, location_id, slot_id, entry_time, exit_time, duration_minutes, total_amount, status, entry_staff_id, exit_staff_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    ['PS-DEMO-003', nehaId, 'MH12CD5678', 'Neha Patel', '9876501234', 'SUV', phoenixMallId, slotMallId, fiveDaysAgo.toISOString(), fiveDaysAgoExit.toISOString(), 45, 20.00, 'completed', rajeshId, rajeshId]
  );

  const sess3Res = await query("SELECT id FROM parking_sessions WHERE session_code = 'PS-DEMO-003'");
  const sess3Id = sess3Res.rows[0]?.id || 3;

  await query(
    `INSERT INTO payments (session_id, user_id, amount, payment_method, transaction_id, payment_status, receipt_number, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [sess3Id, nehaId, 20.00, 'Card', 'TXN-5DAY-776123', 'completed', 'RCP-202611-003', fiveDaysAgoExit.toISOString()]
  );

  // Welcome notification for Arun
  await query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, $2, $3, $4)`,
    [arunId, 'Welcome to ParkSmart', 'Thank you for registering with Smart Parking. You can now discover, pre-book slots, and track parking in real time.', 'info']
  );

  console.log('[Seed] Database initialization and seeding completed successfully!');
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}

module.exports = { seed };