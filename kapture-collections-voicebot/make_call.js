/**
 * Kapture Finance - Outbound Call Trigger Script
 * Triggers Maya Collections Voice Agent to call Raj (+916303551518) via Vapi REST API.
 */

const https = require('https');

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'e8407b73-717f-4aff-9166-cf43d66bb77b';
const ASSISTANT_ID = process.env.ASSISTANT_ID || 'd171149c-73a3-4eef-aea7-d26157d9f7fe';
const PHONE_NUMBER = process.env.PHONE_NUMBER || '+916303551518';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || ''; // Optional: Vapi Outbound Phone Number ID

const payloadData = {
  assistantId: ASSISTANT_ID,
  customer: {
    number: PHONE_NUMBER,
    name: 'Raj'
  }
};

if (PHONE_NUMBER_ID) {
  payloadData.phoneNumberId = PHONE_NUMBER_ID;
}

const payload = JSON.stringify(payloadData);

console.log(`\n===============================================================`);
console.log(`📞 INITIATING OUTBOUND VOICE CALL VIA VAPI API`);
console.log(`===============================================================`);
console.log(`Target Recipient: Raj (${PHONE_NUMBER})`);
console.log(`Assistant ID:     ${ASSISTANT_ID}`);
console.log(`===============================================================\n`);

const options = {
  hostname: 'api.vapi.ai',
  path: '/call',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`HTTP Response Status: ${res.statusCode}`);
    try {
      const responseJson = JSON.parse(data);
      console.log('Vapi API Response:', JSON.stringify(responseJson, null, 2));
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log(`\n✅ Call successfully dispatched to ${PHONE_NUMBER}! Your phone will ring shortly.`);
      } else {
        console.log(`\n⚠️ Note: ${responseJson.message}`);
        console.log(`👉 To complete outbound phone calling over PSTN, import/select a free Vapi Phone Number in dashboard.vapi.ai under 'Phone Numbers'.`);
      }
    } catch (e) {
      console.log('Raw Output:', data);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ Request Error: ${err.message}`);
});

req.write(payload);
req.end();
