const bcrypt = require('bcryptjs');
const { query, transaction } = require('../database/db');
const { generateToken } = require('../middleware/auth');
const { notifyUser } = require('../services/socketService');

// Customer Registration
async function registerCustomer(req, res) {
  try {
    const {
      full_name,
      mobile,
      email,
      vehicle_number,
      vehicle_type = 'Four Wheeler / Car',
      make_model,
      password,
      confirm_password,
    } = req.body;

    // Field validations
    if (!full_name || !mobile || !email || !vehicle_number || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are mandatory: Full Name, Mobile, Email, Vehicle Registration Number, Password.',
      });
    }

    // Mobile validation (10 digits)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be a valid 10-digit number.',
      });
    }

    // Vehicle number formatting (uppercase, no hyphens/spaces for storage or clean)
    const cleanVehicleNumber = vehicle_number.trim().toUpperCase().replace(/\s+/g, '');

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    // Check unique mobile and email
    const existing = await query(
      'SELECT id, mobile, email FROM users WHERE mobile = $1 OR email = $2',
      [cleanMobile, email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.mobile === cleanMobile) {
        return res.status(409).json({ success: false, message: 'This mobile number is already registered. Please login.' });
      }
      return res.status(409).json({ success: false, message: 'This email address is already in use.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save customer and vehicle in transaction
    const result = await transaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (full_name, mobile, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'customer')
         RETURNING id, full_name, mobile, email, role, created_at`,
        [full_name.trim(), cleanMobile, email.toLowerCase().trim(), passwordHash]
      );

      const user = userRes.rows[0];

      const vehicleRes = await client.query(
        `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, make_model, is_primary)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, vehicle_number, vehicle_type, make_model, is_primary`,
        [user.id, cleanVehicleNumber, vehicle_type, make_model || 'Primary Vehicle']
      );

      return { user, vehicle: vehicleRes.rows[0] };
    });

    const token = generateToken(result.user);

    // Welcome notification
    await notifyUser(result.user.id, {
      title: 'Registration Successful',
      message: `Welcome to ParkSmart, ${result.user.full_name}! Your vehicle ${cleanVehicleNumber} is now registered.`,
      type: 'success',
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registration successful! Welcome to ParkSmart.',
      token,
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        mobile: result.user.mobile,
        email: result.user.email,
        role: result.user.role,
      },
      primaryVehicle: result.vehicle,
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
}

// Unified Login for Customer and Staff
async function login(req, res) {
  try {
    const { mobile, password, portal = 'customer' } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');

    const userRes = await query(
      'SELECT id, full_name, mobile, email, password_hash, role FROM users WHERE mobile = $1',
      [cleanMobile]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this mobile number. Please check or register.',
      });
    }

    const user = userRes.rows[0];

    // Password verification
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    // Role-based authorization per portal
    if (portal === 'staff') {
      if (user.role !== 'staff' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: This portal is strictly for authorized parking staff members.',
        });
      }
    } else if (portal === 'customer') {
      if (user.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Please use the Staff Portal to log into your staff account.',
        });
      }
    }

    // Fetch primary vehicle if customer
    let primaryVehicle = null;
    let vehiclesList = [];
    if (user.role === 'customer') {
      const vRes = await query(
        'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_primary DESC, id ASC',
        [user.id]
      );
      vehiclesList = vRes.rows;
      primaryVehicle = vehiclesList[0] || null;
    }

    const token = generateToken(user);

    // Audit log
    await query(
      `INSERT INTO activity_logs (user_id, user_role, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.role, 'LOGIN', 'PORTAL', portal, `User logged in to ${portal} portal`]
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
      primaryVehicle,
      vehicles: vehiclesList,
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
}

// Get User Profile & Vehicles
async function getProfile(req, res) {
  try {
    const userRes = await query(
      'SELECT id, full_name, mobile, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const vehiclesRes = await query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_primary DESC, id ASC',
      [req.user.id]
    );

    return res.json({
      success: true,
      user: userRes.rows[0],
      vehicles: vehiclesRes.rows,
    });
  } catch (error) {
    console.error('[Profile Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
}

// Add Vehicle for Customer
async function addVehicle(req, res) {
  try {
    const { vehicle_number, vehicle_type = 'Four Wheeler / Car', make_model, set_as_primary = false } = req.body;

    if (!vehicle_number) {
      return res.status(400).json({ success: false, message: 'Vehicle registration number is required' });
    }

    const cleanVehicleNumber = vehicle_number.trim().toUpperCase().replace(/\s+/g, '');

    if (set_as_primary) {
      await query('UPDATE vehicles SET is_primary = 0 WHERE user_id = $1', [req.user.id]);
    }

    const vRes = await query(
      `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, make_model, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, cleanVehicleNumber, vehicle_type, make_model || 'Vehicle', set_as_primary ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: `Vehicle ${cleanVehicleNumber} added successfully`,
      vehicle: vRes.rows[0],
    });
  } catch (error) {
    console.error('[Add Vehicle Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to add vehicle' });
  }
}

// Delete Vehicle
async function deleteVehicle(req, res) {
  try {
    const vehicleId = req.params.id;
    await query('DELETE FROM vehicles WHERE id = $1 AND user_id = $2', [vehicleId, req.user.id]);
    return res.json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
  }
}

module.exports = {
  registerCustomer,
  login,
  getProfile,
  addVehicle,
  deleteVehicle,
};
