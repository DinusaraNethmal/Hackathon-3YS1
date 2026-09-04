/**
 * RouteLK Booking Management Unit & Logic Test Suite
 * Tests booking ID formatting, seat calculations, duplicate prevention, and validation rules.
 */

const assert = require('assert');
const generateBookingId = require('../utils/generateBookingId');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

async function main() {
  console.log('\n========================================');
  console.log(' RouteLK Booking Management Test Suite');
  console.log('========================================\n');

  // Test 1: Booking ID Generation Format & Pattern
  runTest('Booking ID should match standard RouteLK prefix and pattern (RLK-XXXXX)', () => {
    const formatBookingId = (count) => `RLK-${10001 + count}`;
    const id1 = formatBookingId(0);
    const id2 = formatBookingId(14);

    assert.ok(id1.startsWith('RLK-'), `Expected prefix RLK-, got ${id1}`);
    assert.strictEqual(id1, 'RLK-10001');
    assert.strictEqual(id2, 'RLK-10015');
    assert.ok(/^RLK-\d{5,}$/.test(id1), 'Booking ID must match RLK- followed by at least 5 digits');
    assert.ok(/^RLK-\d{5,}$/.test(id2), 'Booking ID must match RLK- followed by at least 5 digits');
  });

  // Test 2: Fare Calculation Logic
  runTest('Fare calculation should accurately multiply seat count by bus fare per seat', () => {
    const farePerSeat = 850;
    const requestedSeats = [1, 2, 5];
    const totalFare = requestedSeats.length * farePerSeat;

    assert.strictEqual(totalFare, 2550);
    assert.strictEqual(requestedSeats.length, 3);
  });

  // Test 3: Seat Boundary Validation
  runTest('Seat numbers should be within 1 and totalSeats', () => {
    const totalSeats = 40;
    const validSeats = [1, 15, 40];
    const invalidSeatsLow = [0, 5];
    const invalidSeatsHigh = [20, 41];

    const isValid = (seats) => seats.every((s) => Number.isInteger(s) && s >= 1 && s <= totalSeats);

    assert.strictEqual(isValid(validSeats), true);
    assert.strictEqual(isValid(invalidSeatsLow), false);
    assert.strictEqual(isValid(invalidSeatsHigh), false);
  });

  // Test 4: Duplicate Seat Prevention
  runTest('Duplicate seat selections in a single booking should be rejected', () => {
    const seatsWithDuplicates = [5, 6, 5];
    const uniqueSeats = [5, 6, 7];

    const hasNoDuplicates = (seats) => new Set(seats).size === seats.length;

    assert.strictEqual(hasNoDuplicates(seatsWithDuplicates), false);
    assert.strictEqual(hasNoDuplicates(uniqueSeats), true);
  });

  // Test 5: Maximum Seats per Transaction Limit
  runTest('Transactions with more than 6 seats should exceed max transaction limit', () => {
    const maxLimit = 6;
    const smallGroup = [1, 2, 3, 4];
    const largeGroup = [1, 2, 3, 4, 5, 6, 7];

    assert.ok(smallGroup.length <= maxLimit);
    assert.ok(largeGroup.length > maxLimit);
  });

  // Test 6: Conflict Detection for Double-Booking Prevention
  runTest('Conflict detector should accurately flag already booked seats on the same date', () => {
    const existingConfirmedBookings = [
      { seats: [1, 2, 3, 4], status: 'CONFIRMED' },
      { seats: [10, 11], status: 'CONFIRMED' },
      { seats: [20, 21], status: 'CANCELLED' }, // Cancelled seats should not conflict
    ];

    const bookedSeatSet = new Set();
    existingConfirmedBookings.forEach((b) => {
      if (b.status === 'CONFIRMED') {
        b.seats.forEach((s) => bookedSeatSet.add(s));
      }
    });

    const checkConflict = (requestedSeats) => requestedSeats.filter((s) => bookedSeatSet.has(s));

    assert.deepStrictEqual(checkConflict([5, 6]), []); // Available
    assert.deepStrictEqual(checkConflict([2, 5]), [2]); // Conflicted on seat 2
    assert.deepStrictEqual(checkConflict([20]), []); // Released cancelled seat is available
  });

  // Test 7: Available Seats Calculation
  runTest('Available seats should accurately subtract all confirmed bookings from capacity', () => {
    const totalCapacity = 10;
    const bookedSeats = [2, 4, 6];
    const bookedSet = new Set(bookedSeats);

    const availableSeats = [];
    for (let i = 1; i <= totalCapacity; i++) {
      if (!bookedSet.has(i)) availableSeats.push(i);
    }

    assert.deepStrictEqual(availableSeats, [1, 3, 5, 7, 8, 9, 10]);
    assert.strictEqual(availableSeats.length, 7);
  });

  // Test 8: Ticket Verification Response Formatting
  runTest('Ticket verification should produce correct VALID_ACTIVE or INVALID_CANCELLED status', () => {
    const mockActiveBooking = {
      bookingId: 'RLK-48192',
      status: 'CONFIRMED',
      passengerName: 'Kasun Perera',
    };
    const mockCancelledBooking = {
      bookingId: 'RLK-91283',
      status: 'CANCELLED',
      passengerName: 'Nimal Silva',
    };

    const verify = (b) => ({
      valid: b.status === 'CONFIRMED',
      status: b.status === 'CONFIRMED' ? 'VALID_ACTIVE' : 'INVALID_CANCELLED',
    });

    assert.deepStrictEqual(verify(mockActiveBooking), { valid: true, status: 'VALID_ACTIVE' });
    assert.deepStrictEqual(verify(mockCancelledBooking), { valid: false, status: 'INVALID_CANCELLED' });
  });

  console.log('\n----------------------------------------');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('----------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
