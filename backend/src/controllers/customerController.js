const { query, transaction } = require('../database/db');
const { calculateParkingCharges } = require('../utils/billingService');
const { generatePaymentQr } = require('../services/qrService');
const { notifyUser, broadcastSlotUpdate, broadcastStaffUpdate } = require('../services/socketService');

// Create Parking Slot Booking
async function createBooking(req, res) {
  try {
    const {
      location_id,
      vehicle_id,
      vehicle_number,
      expected_entry_time,
      expected_exit_time,
      duration_hours,
    } = req.body;

    if (!location_id) {
      return res.status(400).json({ success: false, message: 'Parking location ID is required' });
    }

    // Determine target vehicle
    let targetVehicleNumber = vehicle_number;
    if (!targetVehicleNumber && vehicle_id) {
      const vRes = await query('SELECT vehicle_number FROM vehicles WHERE id = $1 AND user_id = $2', [vehicle_id, req.user.id]);
      if (vRes.rows.length > 0) {
        targetVehicleNumber = vRes.rows[0].vehicle_number;
      }
    }

    if (!targetVehicleNumber) {
      return res.status(400).json({ success: false, message: 'Please specify vehicle registration number' });
    }

    targetVehicleNumber = targetVehicleNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Check if this vehicle is ALREADY parked in an active session
    const activeCheck = await query(
      "SELECT id FROM parking_sessions WHERE vehicle_number = $1 AND status IN ('active', 'payment_pending')",
      [targetVehicleNumber]
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${targetVehicleNumber} is already currently parked in an active session.`,
      });
    }

    // Calculate dates & estimated charges
    const entryDate = expected_entry_time ? new Date(expected_entry_time) : new Date();
    let exitDate;
    let hours = duration_hours ? parseFloat(duration_hours) : 2;

    if (expected_exit_time) {
      exitDate = new Date(expected_exit_time);
      const diffMs = exitDate.getTime() - entryDate.getTime();
      hours = Math.max(1, diffMs / (1000 * 3600));
    } else {
      exitDate = new Date(entryDate.getTime() + hours * 3600 * 1000);
    }

    // Billing formula: MAX(1, CEILING(hours)) * 20
    const billedHours = Math.max(1, Math.ceil(hours));
    const estimatedAmount = billedHours * 20.0;

    // ATOMIC SLOT ALLOCATION using transaction
    const bookingResult = await transaction(async (client) => {
      // Find an available slot for this location
      const slotQuery = `
        SELECT id, slot_number, floor_level, section, slot_type
        FROM parking_slots
        WHERE location_id = $1 AND status = 'available'
        ORDER BY section ASC, slot_number ASC
        LIMIT 1
      `;
      const slotRes = await client.query(slotQuery, [location_id]);

      if (slotRes.rows.length === 0) {
        throw new Error('NO_SLOTS_AVAILABLE');
      }

      const allocatedSlot = slotRes.rows[0];

      // Mark slot as reserved
      await client.query(
        "UPDATE parking_slots SET status = 'reserved' WHERE id = $1",
        [allocatedSlot.id]
      );

      // Generate unique Booking Code
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      const bookingCode = `BK-${Date.now().toString().slice(-4)}${randSuffix}`;

      // Insert booking record
      const insertBooking = `
        INSERT INTO bookings (
          booking_code, user_id, vehicle_id, vehicle_number, customer_name, customer_mobile,
          location_id, slot_id, expected_entry_time, expected_exit_time, expected_duration_hours,
          estimated_amount, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmed')
        RETURNING *
      `;

      const bookingRow = await client.query(insertBooking, [
        bookingCode,
        req.user.id,
        vehicle_id || null,
        targetVehicleNumber,
        req.user.full_name,
        req.user.mobile,
        location_id,
        allocatedSlot.id,
        entryDate.toISOString(),
        exitDate.toISOString(),
        hours,
        estimatedAmount,
      ]);

      return {
        booking: bookingRow.rows[0],
        slot: allocatedSlot,
      };
    });

    // Fetch location details for display
    const locRes = await query('SELECT name, address FROM parking_locations WHERE id = $1', [location_id]);
    const location = locRes.rows[0];

    // Real-time notification & Socket broadcasts
    await notifyUser(req.user.id, {
      title: 'Booking Confirmed!',
      message: `Your booking at ${location.name} is confirmed. Allocated Slot: ${bookingResult.slot.slot_number}. Estimated: ₹${estimatedAmount}`,
      type: 'success',
      metadata: { bookingId: bookingResult.booking.id, slot: bookingResult.slot.slot_number },
    });

    broadcastSlotUpdate(location_id, {
      id: bookingResult.slot.id,
      slot_number: bookingResult.slot.slot_number,
      status: 'reserved',
    });

    broadcastStaffUpdate('new_booking', {
      booking: bookingResult.booking,
      slot: bookingResult.slot,
      locationName: location.name,
    });

    return res.status(201).json({
      success: true,
      message: 'Slot successfully booked!',
      booking: {
        ...bookingResult.booking,
        parking_name: location.name,
        parking_address: location.address,
        slot_number: bookingResult.slot.slot_number,
        floor_level: bookingResult.slot.floor_level,
        section: bookingResult.slot.section,
      },
    });
  } catch (error) {
    if (error.message === 'NO_SLOTS_AVAILABLE') {
      return res.status(409).json({
        success: false,
        message: 'Sorry, all slots are currently occupied or reserved at this location. Please try another location or time.',
      });
    }
    console.error('[Create Booking Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
  }
}

// Get Customer Dashboard Data (Live Session, Recent Bookings, Notifications)
async function getCustomerDashboard(req, res) {
  try {
    const userId = req.user.id;

    // 1. Check for Active or Payment-Pending Parking Session
    const activeSessionRes = await query(
      `SELECT ps.*, pl.name as parking_name, pl.address as parking_address,
              pl.price_per_hour, s.slot_number, s.floor_level, s.section
       FROM parking_sessions ps
       JOIN parking_locations pl ON ps.location_id = pl.id
       JOIN parking_slots s ON ps.slot_id = s.id
       WHERE ps.user_id = $1 AND ps.status IN ('active', 'payment_pending')
       ORDER BY ps.id DESC LIMIT 1`,
      [userId]
    );

    let activeSession = null;
    if (activeSessionRes.rows.length > 0) {
      const sess = activeSessionRes.rows[0];
      const entryTime = new Date(sess.entry_time);
      const currentTime = sess.exit_time ? new Date(sess.exit_time) : new Date();
      const charges = calculateParkingCharges(entryTime, currentTime);

      let qrData = null;
      if (sess.status === 'payment_pending') {
        const qr = await generatePaymentQr(charges.totalAmount, sess.session_code, sess.parking_name);
        qrData = qr;
      }

      activeSession = {
        ...sess,
        current_duration_minutes: charges.durationMinutes,
        current_duration_formatted: charges.formattedDuration,
        calculated_amount: charges.totalAmount,
        billed_hours: charges.billedHours,
        payment_qr: qrData,
      };
    }

    // 2. Customer Upcoming / Confirmed Bookings
    const bookingsRes = await query(
      `SELECT b.*, pl.name as parking_name, pl.address as parking_address,
              s.slot_number, s.floor_level, s.section
       FROM bookings b
       JOIN parking_locations pl ON b.location_id = pl.id
       JOIN parking_slots s ON b.slot_id = s.id
       WHERE b.user_id = $1 AND b.status = 'confirmed'
       ORDER BY b.id DESC`,
      [userId]
    );

    // 3. Recent Notifications (Last 10)
    const notifRes = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 10',
      [userId]
    );

    return res.json({
      success: true,
      activeSession,
      confirmedBookings: bookingsRes.rows,
      notifications: notifRes.rows,
    });
  } catch (error) {
    console.error('[Customer Dashboard Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load customer dashboard' });
  }
}

// Cancel Booking
async function cancelBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const { reason = 'Cancelled by customer' } = req.body;

    const bRes = await query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, req.user.id]
    );

    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bRes.rows[0];

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status '${booking.status}'. Cancellation only allowed before vehicle entry.`,
      });
    }

    // Free the slot and update booking in transaction
    await transaction(async (client) => {
      await client.query("UPDATE bookings SET status = 'cancelled', cancellation_reason = $1 WHERE id = $2", [reason, bookingId]);
      if (booking.slot_id) {
        await client.query("UPDATE parking_slots SET status = 'available' WHERE id = $1", [booking.slot_id]);
      }
    });

    // Notify slot availability
    broadcastSlotUpdate(booking.location_id, { id: booking.slot_id, status: 'available' });

    await notifyUser(req.user.id, {
      title: 'Booking Cancelled',
      message: `Booking ${booking.booking_code} has been successfully cancelled.`,
      type: 'info',
    });

    return res.json({ success: true, message: 'Booking successfully cancelled' });
  } catch (error) {
    console.error('[Cancel Booking Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
}

// Complete / Verify Customer Payment
async function processPayment(req, res) {
  try {
    const { session_id, payment_method = 'UPI', transaction_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Fetch session details
    const sessRes = await query(
      `SELECT ps.*, pl.name as parking_name, pl.address as parking_address, s.slot_number
       FROM parking_sessions ps
       JOIN parking_locations pl ON ps.location_id = pl.id
       JOIN parking_slots s ON ps.slot_id = s.id
       WHERE ps.id = $1 AND ps.user_id = $2`,
      [session_id, req.user.id]
    );

    if (sessRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking session not found' });
    }

    const session = sessRes.rows[0];

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed for this parking session.' });
    }

    // Calculate final verifiable amount using backend formula
    const exitTime = session.exit_time ? new Date(session.exit_time) : new Date();
    const billing = calculateParkingCharges(session.entry_time, exitTime);
    const finalAmount = billing.totalAmount;

    // Generate receipt and transaction numbers
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const actualTxnId = transaction_id || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Atomic completion and slot release
    await transaction(async (client) => {
      // 1. Update session status
      await client.query(
        `UPDATE parking_sessions
         SET status = 'completed', exit_time = $1, duration_minutes = $2, total_amount = $3
         WHERE id = $4`,
        [exitTime.toISOString(), billing.durationMinutes, finalAmount, session.id]
      );

      // 2. Release slot back to available
      await client.query(
        "UPDATE parking_slots SET status = 'available' WHERE id = $1",
        [session.slot_id]
      );

      // 3. Insert payment record
      await client.query(
        `INSERT INTO payments (session_id, booking_id, user_id, amount, payment_method, transaction_id, payment_status, receipt_number, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8)`,
        [session.id, session.booking_id, req.user.id, finalAmount, payment_method, actualTxnId, receiptNumber, new Date().toISOString()]
      );

      // 4. Update booking if linked
      if (session.booking_id) {
        await client.query("UPDATE bookings SET status = 'completed' WHERE id = $1", [session.booking_id]);
      }
    });

    // Notify slot is available
    broadcastSlotUpdate(session.location_id, { id: session.slot_id, status: 'available' });

    // Customer notification
    await notifyUser(req.user.id, {
      title: 'Payment Successful',
      message: `Thank you for using Smart Parking! Payment of ₹${finalAmount} received for ${session.vehicle_number}.`,
      type: 'success',
      metadata: { receiptNumber, amount: finalAmount },
    });

    broadcastStaffUpdate('payment_completed', {
      sessionId: session.id,
      amount: finalAmount,
      vehicleNumber: session.vehicle_number,
    });

    return res.json({
      success: true,
      message: 'Payment verified and parking session completed! Thank you for using Smart Parking.',
      receipt: {
        receiptNumber,
        transactionId: actualTxnId,
        vehicleNumber: session.vehicle_number,
        parkingName: session.parking_name,
        parkingAddress: session.parking_address,
        slotNumber: session.slot_number,
        entryTime: session.entry_time,
        exitTime: exitTime.toISOString(),
        durationFormatted: billing.formattedDuration,
        durationMinutes: billing.durationMinutes,
        billedHours: billing.billedHours,
        hourlyRate: billing.hourlyRate,
        amount: finalAmount,
        paymentMethod: payment_method,
        paidAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Payment Process Error]:', error);
    return res.status(500).json({ success: false, message: 'Payment processing failed', error: error.message });
  }
}

// Customer Personal Analytics (strictly isolated to req.user.id)
async function getCustomerAnalytics(req, res) {
  try {
    const userId = req.user.id;

    // 1. Overall stats
    const statsRes = await query(
      `SELECT
         COUNT(*) as total_visits,
         COALESCE(SUM(total_amount), 0) as total_spent,
         COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM parking_sessions
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const stats = statsRes.rows[0];
    const totalVisits = parseInt(stats.total_visits || 0, 10);
    const totalSpent = parseFloat(stats.total_spent || 0);
    const totalHours = parseFloat((parseInt(stats.total_minutes || 0, 10) / 60.0).toFixed(1));

    // 2. Most frequently used parking location
    const topLocRes = await query(
      `SELECT pl.id, pl.name, COUNT(*) as visit_count
       FROM parking_sessions ps
       JOIN parking_locations pl ON ps.location_id = pl.id
       WHERE ps.user_id = $1 AND ps.status = 'completed'
       GROUP BY pl.id, pl.name
       ORDER BY visit_count DESC LIMIT 1`,
      [userId]
    );

    const mostFrequentLocation = topLocRes.rows[0] ? topLocRes.rows[0].name : 'N/A';

    // 3. Monthly expenses chart data (last 6 months)
    const monthlySessions = await query(
      `SELECT entry_time, total_amount, duration_minutes
       FROM parking_sessions
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY entry_time ASC`,
      [userId]
    );

    // Group by month label (e.g. 'Nov 2026')
    const monthsMap = {};
    for (const row of monthlySessions.rows) {
      const d = new Date(row.entry_time);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthsMap[key]) {
        monthsMap[key] = { month: key, amount: 0, visits: 0, hours: 0 };
      }
      monthsMap[key].amount += parseFloat(row.total_amount || 0);
      monthsMap[key].visits += 1;
      monthsMap[key].hours += parseFloat(((row.duration_minutes || 0) / 60).toFixed(1));
    }

    const monthlyExpenses = Object.values(monthsMap);
    if (monthlyExpenses.length === 0) {
      // Provide current month placeholder if no past visits yet
      const currentMonthKey = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyExpenses.push({ month: currentMonthKey, amount: 0, visits: 0, hours: 0 });
    }

    // 4. Detailed Parking Visit History
    const historyRes = await query(
      `SELECT ps.*, pl.name as parking_name, pl.address as parking_address,
              s.slot_number, p.payment_method, p.receipt_number, p.transaction_id
       FROM parking_sessions ps
       JOIN parking_locations pl ON ps.location_id = pl.id
       LEFT JOIN parking_slots s ON ps.slot_id = s.id
       LEFT JOIN payments p ON ps.id = p.session_id
       WHERE ps.user_id = $1
       ORDER BY ps.id DESC LIMIT 30`,
      [userId]
    );

    return res.json({
      success: true,
      analytics: {
        totalVisits,
        totalSpent,
        totalHours,
        mostFrequentLocation,
        monthlyExpenses,
      },
      history: historyRes.rows,
    });
  } catch (error) {
    console.error('[Customer Analytics Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics' });
  }
}

// Get Customer Notifications List
async function getNotifications(req, res) {
  try {
    const notifs = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 50',
      [req.user.id]
    );
    return res.json({ success: true, notifications: notifs.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

// Mark Notification Read
async function markNotificationRead(req, res) {
  try {
    const id = req.params.id;
    if (id === 'all') {
      await query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
    } else {
      await query('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
}

module.exports = {
  createBooking,
  getCustomerDashboard,
  cancelBooking,
  processPayment,
  getCustomerAnalytics,
  getNotifications,
  markNotificationRead,
};
