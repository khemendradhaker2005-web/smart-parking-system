-- ========================================================
-- SMART PARKING MANAGEMENT SYSTEM - POSTGRESQL SCHEMA
-- Safe for Production (Idempotent: uses CREATE TABLE IF NOT EXISTS)
-- ========================================================

-- NOTE: To wipe existing data, manually run the drops below.
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS parking_sessions CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS parking_slots CASCADE;
-- DROP TABLE IF EXISTS parking_locations CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(30) DEFAULT 'Four Wheeler / Car',
    make_model VARCHAR(100),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);

-- 3. PARKING LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS parking_locations (
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
    amenities TEXT DEFAULT '["CCTV Surveillance", "24/7 Security", "EV Fast Charging", "Covered Parking", "Valet Assistance", "Wheelchair Access"]',
    rules TEXT DEFAULT '["Speed limit inside premises: 10 km/h", "Park strictly within designated slot markings", "Retain QR ticket until vehicle exit", "Minimum parking charge: ₹20 (partial hour counted as full hour)"]',
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PARKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES parking_locations(id) ON DELETE CASCADE,
    slot_number VARCHAR(20) NOT NULL,
    floor_level VARCHAR(20) DEFAULT 'Ground Floor',
    section VARCHAR(20) DEFAULT 'A',
    slot_type VARCHAR(30) DEFAULT 'Standard',
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_location_slot UNIQUE (location_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_slots_location_status ON parking_slots(location_id, status);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
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
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 6. PARKING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS parking_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(30) UNIQUE NOT NULL,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100),
    customer_mobile VARCHAR(20),
    vehicle_type VARCHAR(30) DEFAULT 'Four Wheeler / Car',
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
);

CREATE INDEX IF NOT EXISTS idx_sessions_vehicle ON parking_sessions(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON parking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON parking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON parking_sessions(location_id);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
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
);

CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_txn ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 9. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
