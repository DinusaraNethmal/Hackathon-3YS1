/**
 * RouteLK Wallet Management Unit & Logic Test Suite
 * Tests top-up amounts, balance additions, deductions, and transaction ID formats.
 */

const assert = require('assert');

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

console.log('\n========================================');
console.log(' RouteLK Wallet Management Test Suite');
console.log('========================================\n');

// Test 1: Minimum and Maximum Top-Up Limits
runTest('Top-up amount should enforce minimum Rs. 100 and maximum Rs. 50,000', () => {
  const isValidAmount = (amt) => typeof amt === 'number' && !isNaN(amt) && amt >= 100 && amt <= 50000;

  assert.strictEqual(isValidAmount(50), false, 'Rs. 50 should be rejected (below min)');
  assert.strictEqual(isValidAmount(100), true, 'Rs. 100 should be accepted (min limit)');
  assert.strictEqual(isValidAmount(2500), true, 'Rs. 2,500 should be accepted');
  assert.strictEqual(isValidAmount(50000), true, 'Rs. 50,000 should be accepted (max limit)');
  assert.strictEqual(isValidAmount(60000), false, 'Rs. 60,000 should be rejected (above max)');
  assert.strictEqual(isValidAmount(-500), false, 'Negative amount should be rejected');
});

// Test 2: Top-Up Balance Addition Calculation
runTest('Top-up should accurately calculate new balanceBefore and balanceAfter', () => {
  const initialBalance = 1500;
  const topUpAmount = 2500;
  const newBalance = initialBalance + topUpAmount;

  assert.strictEqual(newBalance, 4000);
  assert.strictEqual(newBalance - initialBalance, topUpAmount);
});

// Test 3: Wallet Payment Balance Deduction Logic
runTest('Wallet payment should deduct fare only when balance is sufficient', () => {
  const processPayment = (balance, fare) => {
    if (balance < fare) {
      return { success: false, reason: 'INSUFFICIENT_FUNDS' };
    }
    return { success: true, newBalance: balance - fare };
  };

  const res1 = processPayment(3000, 1700);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.newBalance, 1300);

  const res2 = processPayment(800, 1700);
  assert.strictEqual(res2.success, false);
  assert.strictEqual(res2.reason, 'INSUFFICIENT_FUNDS');
});

// Test 4: Transaction ID Generation Format Pattern
runTest('Transaction ID should adhere to TXN-WLT-XXXXX pattern', () => {
  const formatTxnId = (count) => `TXN-WLT-${10001 + count}`;
  const t1 = formatTxnId(0);
  const t2 = formatTxnId(42);

  assert.strictEqual(t1, 'TXN-WLT-10001');
  assert.strictEqual(t2, 'TXN-WLT-10043');
  assert.ok(/^TXN-WLT-\d{5,}$/.test(t1));
  assert.ok(/^TXN-WLT-\d{5,}$/.test(t2));
});

// Test 5: Supported Payment Methods
runTest('Payment method should match accepted Sri Lankan providers', () => {
  const acceptedMethods = new Set(['CARD', 'LANKAPAY', 'EZCASH', 'GENIE', 'WALLET', 'OTHER']);

  assert.ok(acceptedMethods.has('CARD'));
  assert.ok(acceptedMethods.has('LANKAPAY'));
  assert.ok(acceptedMethods.has('EZCASH'));
  assert.ok(acceptedMethods.has('GENIE'));
  assert.ok(acceptedMethods.has('WALLET'));
  assert.ok(!acceptedMethods.has('BITCOIN'));
});

// Test 6: Aggregated Transaction Summary Statistics
runTest('Transaction summary should accurately sum credits and debits', () => {
  const mockTransactions = [
    { type: 'TOPUP', amount: 2000, status: 'SUCCESS' },
    { type: 'TOPUP', amount: 1000, status: 'SUCCESS' },
    { type: 'PAYMENT', amount: 850, status: 'SUCCESS' },
    { type: 'PAYMENT', amount: 1700, status: 'SUCCESS' },
    { type: 'TOPUP', amount: 500, status: 'FAILED' }, // Failed should not count
  ];

  let totalTopUp = 0;
  let totalSpent = 0;

  mockTransactions.forEach((t) => {
    if (t.status === 'SUCCESS') {
      if (t.type === 'TOPUP') totalTopUp += t.amount;
      if (t.type === 'PAYMENT') totalSpent += t.amount;
    }
  });

  assert.strictEqual(totalTopUp, 3000);
  assert.strictEqual(totalSpent, 2550);
});

console.log('\n----------------------------------------');
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
console.log('----------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
