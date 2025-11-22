/**
 * Manual test script for S-DAL (Secure Data Access Layer)
 * 
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Run this script: node scripts/test-sdal.js
 * 
 * Prerequisites:
 * - Have at least one agent created in the system
 * - Know the agentId and userId
 * - Have Firebase credentials configured
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testSDAL() {
  console.log('=== S-DAL Manual Test ===\n');
  
  const agentId = await question('Enter agentId: ');
  const userId = await question('Enter userId: ');
  const baseUrl = await question('Enter API base URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  
  console.log('\n--- Test 1: Query allowed collection ---');
  const allowedCollection = await question('Enter an allowed collection name for this agent: ');
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await question('Enter Firebase ID token: ')}`
      },
      body: JSON.stringify({
        agentId,
        message: `Query ${allowedCollection} collection with limit 5`
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ SUCCESS: Query succeeded');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED:', data.error || data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('\n--- Test 2: Query disallowed collection ---');
  const disallowedCollection = await question('Enter a collection NOT in agent\'s allowed list: ');
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await question('Enter Firebase ID token: ')}`
      },
      body: JSON.stringify({
        agentId,
        message: `Query ${disallowedCollection} collection`
      })
    });
    
    const data = await response.json();
    if (response.status === 403 || (data.error && data.error.includes('not allowed'))) {
      console.log('✅ SUCCESS: Access correctly denied');
      console.log('Error message:', data.error || data.message);
    } else {
      console.log('❌ FAILED: Should have been denied but got:', response.status, data);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('\n--- Test 3: Check audit logs ---');
  console.log('Check Firestore collection "audit_logs" for entries with:');
  console.log(`  - agentId: ${agentId}`);
  console.log(`  - userId: ${userId}`);
  console.log('  - Look for entries with denied: true for the disallowed query');
  
  rl.close();
}

testSDAL().catch(console.error);

