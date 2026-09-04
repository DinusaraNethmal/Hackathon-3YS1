/**
 * RouteLK PayHere Payment Gateway Unit Test Suite
 * Validates cryptographic MD5 hash calculations and IPN signature checks.
 */

const assert = require('assert');
const { generatePayHereHash, verifyPayHereSignature } = require('../utils/payhereHelper');

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
console.log(' RouteLK PayHere Integration Test Suite');
console.log('========================================\n');

// Test 1: Hash calculation matches PayHere standard
runTest('generatePayHereHash should generate expected 32-character uppercase MD5 hash', () => {
  const merchantId = '1211149';
  const orderId = 'ORD-PH-1001';
  const amount = 1000;
  const currency = 'LKR';
  const merchantSecret = '4Tx85f8B98Z4M997e3R0e1f78Q299e56T';

  const hash = generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret);

  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 32);
  assert.strictEqual(hash, hash.toUpperCase());
});

// Test 2: Formatting decimal precision handling
runTest('generatePayHereHash should properly format integers and floats to 2 decimal places', () => {
  const merchantId = '1211149';
  const orderId = 'ORD-PH-1002';
  const merchantSecret = '4Tx85f8B98Z4M997e3R0e1f78Q299e56T';

  const hashInt = generatePayHereHash(merchantId, orderId, 1500, 'LKR', merchantSecret);
  const hashFloat = generatePayHereHash(merchantId, orderId, 1500.0, 'LKR', merchantSecret);
  const hashString = generatePayHereHash(merchantId, orderId, '1500.00', 'LKR', merchantSecret);

  assert.strictEqual(hashInt, hashFloat);
  assert.strictEqual(hashInt, hashString);
});

// Test 3: IPN Signature verification for Success status
runTest('verifyPayHereSignature should return true for valid success notification', () => {
  const merchantId = '1211149';
  const orderId = 'ORD-PH-2001';
  const amount = 2500;
  const currency = 'LKR';
  const statusCode = '2'; // 2 = Success in PayHere
  const merchantSecret = '4Tx85f8B98Z4M997e3R0e1f78Q299e56T';

  // Compute expected sig
  const crypto = require('crypto');
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const validSig = crypto.createHash('md5').update(`${merchantId}${orderId}2500.00${currency}${statusCode}${hashedSecret}`).digest('hex').toUpperCase();

  const isVerified = verifyPayHereSignature(merchantId, orderId, amount, currency, statusCode, merchantSecret, validSig);
  assert.strictEqual(isVerified, true);
});

// Test 4: Tampered signature rejection
runTest('verifyPayHereSignature should reject tampered amounts or invalid signatures', () => {
  const merchantId = '1211149';
  const orderId = 'ORD-PH-2001';
  const amount = 2500;
  const currency = 'LKR';
  const statusCode = '2';
  const merchantSecret = '4Tx85f8B98Z4M997e3R0e1f78Q299e56T';

  const fakeSig = '00000000000000000000000000000000';
  const isVerified = verifyPayHereSignature(merchantId, orderId, amount, currency, statusCode, merchantSecret, fakeSig);
  assert.strictEqual(isVerified, false);

  // Tampered amount check
  const crypto = require('crypto');
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const validSigFor100 = crypto.createHash('md5').update(`${merchantId}${orderId}100.00${currency}${statusCode}${hashedSecret}`).digest('hex').toUpperCase();
  
  // Received sig was for 100, but checking 2500
  const isTamperedVerified = verifyPayHereSignature(merchantId, orderId, 2500, currency, statusCode, merchantSecret, validSigFor100);
  assert.strictEqual(isTamperedVerified, false);
});

console.log('----------------------------------------');
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
console.log('----------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
}

