const { Server } = require('socket.io');
const { query } = require('../database/db');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    // Client joins their personal user room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Staff joins staff channel
    socket.on('join_staff', () => {
      socket.join('staff_room');
    });

    // Client joins a specific location room to track slot updates
    socket.on('join_location', (locationId) => {
      if (locationId) {
        socket.join(`location_${locationId}`);
      }
    });

    socket.on('leave_location', (locationId) => {
      if (locationId) {
        socket.leave(`location_${locationId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });

  console.log('[Socket.IO] Real-time engine initialized.');
  return io;
}

function getIO() {
  return io;
}

/**
 * Send real-time notification to a specific user
 * Also persist to notifications table in the database
 */
async function notifyUser(userId, { title, message, type = 'info', metadata = null }) {
  try {
    // 1. Save to Database
    if (userId) {
      const metaString = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;
      await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, metadata)
         VALUES ($1, $2, $3, $4, 0, $5)`,
        [userId, title, message, type, metaString]
      );
    }

    // 2. Emit Socket Event to user's room
    if (io && userId) {
      io.to(`user_${userId}`).emit('notification', {
        title,
        message,
        type,
        metadata,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Socket Notify Error]:', err.message);
  }
}

/**
 * Broadcast slot status changes (to all clients watching location and staff)
 */
function broadcastSlotUpdate(locationId, slotData) {
  if (io) {
    io.to(`location_${locationId}`).emit('slot_updated', { locationId, slot: slotData });
    io.to('staff_room').emit('slot_updated', { locationId, slot: slotData });
  }
}

/**
 * Broadcast dashboard metrics update to staff
 */
function broadcastStaffUpdate(event, data) {
  if (io) {
    io.to('staff_room').emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  notifyUser,
  broadcastSlotUpdate,
  broadcastStaffUpdate,
};
