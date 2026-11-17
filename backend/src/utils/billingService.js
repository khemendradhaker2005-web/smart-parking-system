/**
 * Billing Service:
 * Formula: Total Amount = MAX(1, CEILING(Total Duration in Hours)) × ₹20
 * Minimum mandatory charge = ₹20
 * Rate = ₹20 / hour
 */

const HOURLY_RATE = 20.0;

function calculateParkingCharges(entryTime, exitTime = new Date()) {
  const start = new Date(entryTime);
  const end = new Date(exitTime);

  const durationMs = Math.max(0, end.getTime() - start.getTime());
  const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));
  const durationHours = durationMinutes / 60.0;

  // Charge partial hours as full hours, min 1 hour
  const billedHours = Math.max(1, Math.ceil(durationHours));
  const totalAmount = billedHours * HOURLY_RATE;

  // Format human-readable duration
  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const formattedDuration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  return {
    durationMinutes,
    durationHours: parseFloat(durationHours.toFixed(2)),
    billedHours,
    hourlyRate: HOURLY_RATE,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    formattedDuration,
  };
}

module.exports = {
  HOURLY_RATE,
  calculateParkingCharges,
};
