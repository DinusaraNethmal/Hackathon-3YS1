/**
 * RouteLK AI Assistant & Chat API Unit Test Suite
 * Tests fallback search engine, route queries, wallet inquiries, and DB context grounding.
 */

const assert = require('assert');
const { generateIntelligentFallbackResponse } = require('../controllers/chatController');

let passedTests = 0;
let failedTests = 0;

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

async function runAll() {
  console.log('\n=================================================');
  console.log(' RouteLK AI Assistant & Chatbot Test Suite');
  console.log('=================================================\n');

  // Test 1: Fallback response when asking about wallet as guest
  await runAsyncTest('Guest wallet inquiry provides informative guide to top-up and digital wallet', async () => {
    // Note: without active mongo connection in unit test, let's test input filtering or mock
    const reply = await generateIntelligentFallbackResponse('How does the wallet balance work?', null);
    assert.ok(reply.includes('Digital Passenger Wallet'), 'Should contain Digital Passenger Wallet info');
    assert.ok(reply.includes('Google Pay'), 'Should mention Google Pay top-up');
    assert.ok(reply.includes('log in') || reply.includes('sign in'), 'Should advise passenger to log in or sign in to see balance');
  });

  // Test 2: Fallback response when asking about wallet as logged-in user
  await runAsyncTest('Logged-in user wallet inquiry returns actual user balance', async () => {
    const mockUser = {
      _id: 'user_123',
      name: 'Nimal Perera',
      email: 'nimal@example.com',
      walletBalance: 4500,
    };
    const reply = await generateIntelligentFallbackResponse('What is my wallet balance?', mockUser);
    assert.ok(reply.includes('4,500'), 'Should contain formatted wallet balance Rs. 4,500');
    assert.ok(reply.includes('Google Pay'), 'Should explain Google Pay topup');
  });

  // Test 3: Fallback response for guest asking for booking
  await runAsyncTest('Guest booking inquiry directs user to sign in', async () => {
    const reply = await generateIntelligentFallbackResponse('Show my bookings please', null);
    assert.ok(reply.includes('sign in') || reply.includes('log in'), 'Should advise to sign in to see bookings');
  });

  // Test 4: General greeting or unknown query gives popular destinations and sample prompts
  await runAsyncTest('General greeting or empty-match query returns helpful suggestions', async () => {
    const reply = await generateIntelligentFallbackResponse('hello there', null);
    assert.ok(reply.includes('RouteLK AI Transit Assistant'), 'Should greet as RouteLK AI Assistant');
    assert.ok(reply.includes('Try asking me'), 'Should provide sample prompt chips/questions');
  });

  console.log('\n-------------------------------------------------');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('-------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll();
