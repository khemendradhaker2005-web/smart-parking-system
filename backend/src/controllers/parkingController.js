const { query } = require('../database/db');

// Helper: Haversine distance formula in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(1)); // km rounded to 1 decimal
}

// Get All Parking Locations with Live Slot Counts & Real-time Filters
async function getLocations(req, res) {
  try {
    const {
      search,
      userLat,
      userLng,
      maxDistance,
      onlyAvailable,
      sortBy = 'rating', // 'rating', 'price_asc', 'price_desc', 'distance', 'name'
    } = req.query;

    const locationsRes = await query('SELECT * FROM parking_locations ORDER BY id ASC');
    let locations = locationsRes.rows;

    // Get live slot statistics for each location
    const slotsRes = await query('SELECT location_id, status, count(*) as count FROM parking_slots GROUP BY location_id, status');
    const slotStatsMap = {};

    for (const row of slotsRes.rows) {
      if (!slotStatsMap[row.location_id]) {
        slotStatsMap[row.location_id] = { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
      }
      slotStatsMap[row.location_id][row.status] = parseInt(row.count, 10);
    }

    // Enrich locations with slot counts, parsed amenities/rules, and real distance
    locations = locations.map((loc) => {
      const stats = slotStatsMap[loc.id] || { available: 0, occupied: 0, reserved: 0, maintenance: 0 };
      const totalSlots = loc.total_slots || (stats.available + stats.occupied + stats.reserved + stats.maintenance);

      let distance = null;
      if (userLat && userLng) {
        distance = calculateHaversineDistance(
          parseFloat(userLat),
          parseFloat(userLng),
          parseFloat(loc.latitude),
          parseFloat(loc.longitude)
        );
      } else {
        // Default reference distance from Bangalore City Center (12.9716, 77.5946)
        distance = calculateHaversineDistance(
          12.9716,
          77.5946,
          parseFloat(loc.latitude),
          parseFloat(loc.longitude)
        );
      }

      let parsedAmenities = [];
      let parsedRules = [];
      try {
        parsedAmenities = typeof loc.amenities === 'string' ? JSON.parse(loc.amenities) : (loc.amenities || []);
      } catch (e) {
        parsedAmenities = [loc.amenities];
      }
      try {
        parsedRules = typeof loc.rules === 'string' ? JSON.parse(loc.rules) : (loc.rules || []);
      } catch (e) {
        parsedRules = [loc.rules];
      }

      return {
        ...loc,
        total_slots: totalSlots,
        available_slots: stats.available,
        occupied_slots: stats.occupied,
        reserved_slots: stats.reserved,
        maintenance_slots: stats.maintenance,
        distance_km: distance,
        amenities: parsedAmenities,
        rules: parsedRules,
        is_available: stats.available > 0,
        availability_status: stats.available > 5 ? 'High Availability' : (stats.available > 0 ? 'Few Slots Left' : 'Full / No Slots'),
      };
    });

    // 1. Search filter
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      locations = locations.filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        (loc.city && loc.city.toLowerCase().includes(q))
      );
    }

    // 2. Filter by availability
    if (onlyAvailable === 'true' || onlyAvailable === true) {
      locations = locations.filter(loc => loc.available_slots > 0);
    }

    // 3. Filter by distance
    if (maxDistance && !isNaN(maxDistance)) {
      const maxD = parseFloat(maxDistance);
      locations = locations.filter(loc => loc.distance_km <= maxD);
    }

    // 4. Sorting
    if (sortBy === 'rating') {
      locations.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_asc') {
      locations.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (sortBy === 'price_desc') {
      locations.sort((a, b) => b.price_per_hour - a.price_per_hour);
    } else if (sortBy === 'distance') {
      locations.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    } else if (sortBy === 'name') {
      locations.sort((a, b) => a.name.localeCompare(b.name));
    }

    return res.json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.error('[Get Locations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch parking locations' });
  }
}

// Get Specific Parking Location Details
async function getLocationDetails(req, res) {
  try {
    const locId = req.params.id;
    const locRes = await query('SELECT * FROM parking_locations WHERE id = $1', [locId]);

    if (locRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }

    const location = locRes.rows[0];

    // Get live slots
    const slotsRes = await query(
      'SELECT id, slot_number, floor_level, section, slot_type, status FROM parking_slots WHERE location_id = $1 ORDER BY section, slot_number',
      [locId]
    );

    const stats = {
      total: slotsRes.rows.length,
      available: slotsRes.rows.filter(s => s.status === 'available').length,
      occupied: slotsRes.rows.filter(s => s.status === 'occupied').length,
      reserved: slotsRes.rows.filter(s => s.status === 'reserved').length,
      maintenance: slotsRes.rows.filter(s => s.status === 'maintenance').length,
    };

    let amenities = [];
    let rules = [];
    try {
      amenities = typeof location.amenities === 'string' ? JSON.parse(location.amenities) : (location.amenities || []);
      rules = typeof location.rules === 'string' ? JSON.parse(location.rules) : (location.rules || []);
    } catch (e) {
      amenities = [location.amenities];
      rules = [location.rules];
    }

    return res.json({
      success: true,
      location: {
        ...location,
        amenities,
        rules,
        stats,
      },
      slots: slotsRes.rows,
    });
  } catch (error) {
    console.error('[Location Details Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch location details' });
  }
}

module.exports = {
  getLocations,
  getLocationDetails,
};
