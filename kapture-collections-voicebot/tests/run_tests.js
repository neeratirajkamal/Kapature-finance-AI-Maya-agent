/**
 * Automated CLI Test Suite for Kapture Finance Voice AI Collections Agent (Maya)
 * Runs evaluation scenarios against the local mock webhook server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const testCasesPath = path.join(__dirname, 'test_cases.json');
const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

console.log(`\n===============================================================`);
console.log(`🧪 KAPTURE FINANCE VOICE AI - AUTOMATED EVALUATION SUITE`);
console.log(`===============================================================\n`);

let passedCount = 0;
let failedCount = 0;

function runSingleTest(test, callback) {
  const payload = JSON.stringify({
    message: {
      type: 'tool-calls',
      toolCalls: [
        {
          id: `eval_${test.test_id}`,
          function: {
            name: test.test_id === 'TC-004' ? 'escalate_to_agent' : 
                  test.test_id === 'TC-006' ? 'mark_disposition' : 'verify_customer',
            arguments: test.test_id === 'TC-004' ? { account_id: 'ACC-88392', reason: 'HARDSHIP_REQUEST' } :
                       test.test_id === 'TC-006' ? { account_id: 'ACC-88392', status: 'DO_NOT_CALL' } :
                       { account_id: 'ACC-88392', verification_code: '1234' }
          }
        }
      ]
    }
  });

  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const isSuccess = res.statusCode === 200 && data.includes('results');
      if (isSuccess) {
        console.log(`✅ [PASS] [${test.test_id}] ${test.category} - ${test.description}`);
        passedCount++;
      } else {
        console.log(`❌ [FAIL] [${test.test_id}] ${test.category}`);
        failedCount++;
      }
      callback();
    });
  });

  req.on('error', (err) => {
    console.log(`❌ [ERROR] [${test.test_id}] Server unreachable (${err.message})`);
    failedCount++;
    callback();
  });

  req.write(payload);
  req.end();
}

function runAllTests(index) {
  if (index >= testCases.length) {
    console.log(`\n===============================================================`);
    console.log(`📊 EVALUATION SUMMARY: ${passedCount}/${testCases.length} PASSED`);
    console.log(`===============================================================\n`);
    process.exit(failedCount > 0 ? 1 : 0);
  }

  runSingleTest(testCases[index], () => {
    runAllTests(index + 1);
  });
}

runAllTests(0);
