#!/usr/bin/env node

/**
 * Test script to verify Razorpay credentials and API connectivity
 * Run with: node scripts/test-razorpay.js
 */

require('dotenv').config({ path: '.env.local' });

async function testRazorpayCredentials() {
  console.log('🔍 Testing Razorpay Configuration...\n');

  // Check environment variables
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log('📋 Environment Variables:');
  console.log(`  RAZORPAY_KEY_ID: ${keyId ? '✅ Set' : '❌ Missing'}`);
  console.log(`  RAZORPAY_KEY_SECRET: ${keySecret ? '✅ Set' : '❌ Missing'}`);

  if (!keyId || !keySecret) {
    console.log('\n❌ Missing Razorpay credentials. Please check your .env.local file.');
    console.log('   Make sure you have:');
    console.log('   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID');
    console.log('   RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET');
    return;
  }

  // Validate key format
  console.log('\n🔑 Key Format Validation:');
  const keyIdValid = keyId.startsWith('rzp_');
  const keySecretValid = keySecret.startsWith('rzp_');
  
  console.log(`  Key ID format: ${keyIdValid ? '✅ Valid' : '❌ Invalid'} (should start with 'rzp_')`);
  console.log(`  Key Secret format: ${keySecretValid ? '✅ Valid' : '❌ Invalid'} (should start with 'rzp_')`);

  if (!keyIdValid || !keySecretValid) {
    console.log('\n❌ Invalid key format. Keys should start with "rzp_"');
    return;
  }

  // Test API connectivity
  console.log('\n🌐 Testing API Connectivity...');
  
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: 100, // 1 rupee in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
      }),
    });

    const data = await response.json();
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('  ✅ API connection successful!');
      console.log(`  Order ID: ${data.id}`);
      console.log(`  Amount: ${data.amount} paise (₹${data.amount / 100})`);
    } else {
      console.log('  ❌ API connection failed');
      console.log(`  Error: ${data.error?.description || 'Unknown error'}`);
      
      if (response.status === 401) {
        console.log('\n💡 This usually means:');
        console.log('   - Invalid credentials');
        console.log('   - Using test keys in production or vice versa');
        console.log('   - Keys are not properly configured');
      }
    }
  } catch (error) {
    console.log('  ❌ Network error:', error.message);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. If all tests pass, your Razorpay integration should work');
  console.log('   2. If there are errors, check your Razorpay dashboard');
  console.log('   3. Make sure you\'re using the correct environment (test/live)');
  console.log('   4. Verify your account is active and has sufficient balance');
}

// Run the test
testRazorpayCredentials().catch(console.error); 