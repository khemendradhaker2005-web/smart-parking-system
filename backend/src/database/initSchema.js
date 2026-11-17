const { query, initDatabase, getActiveEngine } = require('./db');

/**
 * Initialize all database tables and indexes safely and idempotently.
 * Supports both PostgreSQL and SQLite (sql.js).
 */
async function initSchema() {
  console.log('[Schema] Checking and initializing database schema...');
  await initDatabase();

  const isPg = getActiveEngine() === 'pg';

  const ddlStatements = isPg
    ? [
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(100) NOT NULL,
          mobile VARCHAR(15) UNIQUE NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS vehicles (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          vehicle_number VARCHAR(20) NOT NULL,
          vehicle_type VARCHAR(50) DEFAULT 'Four Wheeler / Car',
          make_model VARCHAR(100),
          is_primary BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS parking_locations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) DEFAULT 'Bangalore',
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          total_slots INT NOT NULL DEFAULT 40,
          price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
          rating DECIMAL(3, 2) DEFAULT 4.80,
          operating_hours VARCHAR(100) DEFAULT '24/7 Open',
          contact_number VARCHAR(20) DEFAULT '+91 98765 43210',
          amenities TEXT DEFAULT '["CCTV Surveillance", "24/7 Security", "EV Fast Charging", "Covered Parking", "Valet Assistance"]',
          rules TEXT DEFAULT '["Speed limit 10 km/h", "Park strictly within slot markings", "₹20/hour rate (partial counted as full)", "Minimum mandatory charge ₹20"]',
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS parking_slots (
          id SERIAL PRIMARY KEY,
          location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
          slot_number VARCHAR(20) NOT NULL,
          floor_level VARCHAR(50) DEFAULT 'Ground Floor',
          section VARCHAR(20) DEFAULT 'A',
          slot_type VARCHAR(30) DEFAULT 'Standard',
          status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'maintenance')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          booking_code VARCHAR(30) UNIQUE NOT NULL,
          user_id INT REFERENCES users(id) ON DELETE SET NULL,
          vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
          vehicle_number VARCHAR(20) NOT NULL,
          customer_name VARCHAR(100),
          customer_mobile VARCHAR(20),
          location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
          slot_id INT REFERENCES parking_slots(id) ON DELETE SET NULL,
          expected_entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
          expected_exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
          expected_duration_hours DECIMAL(5, 2) NOT NULL,
          estimated_amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'active', 'completed', 'cancelled')),
          cancellation_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS parking_sessions (
          id SERIAL PRIMARY KEY,
          session_code VARCHAR(30) UNIQUE NOT NULL,
          booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
          user_id INT REFERENCES users(id) ON DELETE SET NULL,
          vehicle_number VARCHAR(20) NOT NULL,
          customer_name VARCHAR(100),
          customer_mobile VARCHAR(20),
          vehicle_type VARCHAR(50) DEFAULT 'Four Wheeler / Car',
          location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
          slot_id INT REFERENCES parking_slots(id) ON DELETE SET NULL,
          entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          exit_time TIMESTAMP WITH TIME ZONE,
          duration_minutes INT DEFAULT 0,
          total_amount DECIMAL(10, 2) DEFAULT 0.00,
          status VARCHAR(25) DEFAULT 'active' CHECK (status IN ('active', 'payment_pending', 'completed', 'cancelled')),
          entry_staff_id INT REFERENCES users(id) ON DELETE SET NULL,
          exit_staff_id INT REFERENCES users(id) ON DELETE SET NULL,
          manual_override_reason TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          session_id INT REFERENCES parking_sessions(id) ON DELETE CASCADE,
          booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
          user_id INT REFERENCES users(id) ON DELETE SET NULL,
          amount DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(30) DEFAULT 'UPI',
          transaction_id VARCHAR(100) UNIQUE NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
          qr_data TEXT,
          receipt_number VARCHAR(50) UNIQUE NOT NULL,
          paid_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(150) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(30) DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          metadata TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE SET NULL,
          user_role VARCHAR(20),
          action VARCHAR(100) NOT NULL,
          target_type VARCHAR(50),
          target_id VARCHAR(50),
          details TEXT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);`,
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
        `CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_sessions_vehicle ON parking_sessions(vehicle_number);`,
        `CREATE INDEX IF NOT EXISTS idx_sessions_user ON parking_sessions(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_slots_loc_status ON parking_slots(location_id, status);`
      ]
    : [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          mobile TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          vehicle_number TEXT NOT NULL,
          vehicle_type TEXT DEFAULT 'Four Wheeler / Car',
          make_model TEXT,
          is_primary BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS parking_locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'Bangalore',
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          total_slots INTEGER NOT NULL DEFAULT 40,
          price_per_hour REAL NOT NULL DEFAULT 20.00,
          rating REAL DEFAULT 4.80,
          operating_hours TEXT DEFAULT '24/7 Open',
          contact_number TEXT DEFAULT '+91 98765 43210',
          amenities TEXT DEFAULT '["CCTV Surveillance", "24/7 Security", "EV Fast Charging", "Covered Parking", "Valet Assistance"]',
          rules TEXT DEFAULT '["Speed limit 10 km/h", "Park strictly within slot markings", "₹20/hour rate (partial counted as full)", "Minimum mandatory charge ₹20"]',
          image_url TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS parking_slots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location_id INTEGER,
          slot_number TEXT NOT NULL,
          floor_level TEXT DEFAULT 'Ground Floor',
          section TEXT DEFAULT 'A',
          slot_type TEXT DEFAULT 'Standard',
          status TEXT DEFAULT 'available',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (location_id) REFERENCES parking_locations(id) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          booking_code TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          vehicle_id INTEGER,
          vehicle_number TEXT NOT NULL,
          customer_name TEXT,
          customer_mobile TEXT,
          location_id INTEGER,
          slot_id INTEGER,
          expected_entry_time TEXT NOT NULL,
          expected_exit_time TEXT NOT NULL,
          expected_duration_hours REAL NOT NULL,
          estimated_amount REAL NOT NULL,
          status TEXT DEFAULT 'confirmed',
          cancellation_reason TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (location_id) REFERENCES parking_locations(id),
          FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
        );`,

        `CREATE TABLE IF NOT EXISTS parking_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_code TEXT UNIQUE NOT NULL,
          booking_id INTEGER,
          user_id INTEGER,
          vehicle_number TEXT NOT NULL,
          customer_name TEXT,
          customer_mobile TEXT,
          vehicle_type TEXT DEFAULT 'Four Wheeler / Car',
          location_id INTEGER,
          slot_id INTEGER,
          entry_time TEXT DEFAULT CURRENT_TIMESTAMP,
          exit_time TEXT,
          duration_minutes INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0.00,
          status TEXT DEFAULT 'active',
          entry_staff_id INTEGER,
          exit_staff_id INTEGER,
          manual_override_reason TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (location_id) REFERENCES parking_locations(id),
          FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
        );`,

        `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          booking_id INTEGER,
          user_id INTEGER,
          amount REAL NOT NULL,
          payment_method TEXT DEFAULT 'UPI',
          transaction_id TEXT UNIQUE NOT NULL,
          payment_status TEXT DEFAULT 'pending',
          qr_data TEXT,
          receipt_number TEXT UNIQUE NOT NULL,
          paid_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES parking_sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );`,

        `CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          is_read BOOLEAN DEFAULT 0,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS activity_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          user_role TEXT,
          action TEXT NOT NULL,
          target_type TEXT,
          target_id TEXT,
          details TEXT,
          ip_address TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      ];

  for (const stmt of ddlStatements) {
    try {
      await query(stmt);
    } catch (err) {
      console.warn('[DDL Notice]', err.message);
    }
  }

  console.log(`[Schema] Database tables and indexes verified successfully (${isPg ? 'PostgreSQL' : 'Embedded SQLite'}).`);
}

if (require.main === module) {
  initSchema()
    .then(() => {
      console.log('[Schema] Schema initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Schema Error]:', err);
      process.exit(1);
    });
}

module.exports = { initSchema };
