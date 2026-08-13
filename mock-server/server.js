/**
 * Kapture Finance - Outbound Voice AI Collections Webhook Backend Server
 * Agent Persona: "Maya"
 * Platform: Vapi.ai Function Calling Integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In-Memory Database for Mock State Tracking
const mockDatabase = {
  customer: {
    account_id: 'ACC-88392',
    name: 'Raj',
    loan_type: 'Personal Loan',
    overdue_amount: 8499,
    dpd: 12,
    phone: '+916303551518',
    valid_codes: ['1234', '1995']
  },
  dispositions: [],
  ptp_records: [],
  payment_links_sent: []
};

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Kapture Collections Voice AI Webhook Server',
    agent: 'Maya',
    timestamp: new Date().toISOString()
  });
});

// Trigger Outbound Vapi Phone Call Endpoint
app.post('/api/call', (req, res) => {
  const https = require('https');
  const targetPhone = req.body.phone || '+916303551518';
  const customerName = req.body.name || 'Raj';

  const payload = JSON.stringify({
    assistantId: process.env.VAPI_ASSISTANT_ID || 'd171149c-73a3-4eef-aea7-d26157d9f7fe',
    customer: {
      number: targetPhone,
      name: customerName
    }
  });

  const options = {
    hostname: 'api.vapi.ai',
    path: '/call',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY || 'e8407b73-717f-4aff-9166-cf43d66bb77b'}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const vapiReq = https.request(options, (vapiRes) => {
    let data = '';
    vapiRes.on('data', chunk => data += chunk);
    vapiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (vapiRes.statusCode === 400 && json.message && json.message.toLowerCase().includes('phone number')) {
          return res.status(400).json({
            status: 'phone_number_required',
            message: 'Outbound phone calls require attaching a caller phone number in Vapi Dashboard (https://dashboard.vapi.ai -> Phone Numbers). Use "Start Live Voice Call" for in-browser microphone audio!',
            vapi_error: json
          });
        }
        return res.status(vapiRes.statusCode).json(json);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse Vapi response', raw: data });
      }
    });
  });

  vapiReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  vapiReq.write(payload);
  vapiReq.end();
});

// Main Vapi Webhook Endpoint
app.post('/webhook', (req, res) => {
  const { message } = req.body;

  // Log incoming webhook type for visibility
  if (!message) {
    console.log('[Webhook] Received generic HTTP ping / request');
    return res.status(200).json({ status: 'acknowledged' });
  }

  console.log(`\n==================================================`);
  console.log(`[VAPI EVENT]: ${message.type || 'UNKNOWN'}`);
  console.log(`==================================================`);

  // Handle Function / Tool Calls from Vapi
  if (message.type === 'tool-calls') {
    const toolCall = message.toolCalls && message.toolCalls[0];
    
    if (!toolCall) {
      return res.status(400).json({ error: 'No tool call payload found' });
    }

    const { name } = toolCall.function;
    const callId = toolCall.id;
    let args = toolCall.function.arguments;

    // Safely parse stringified JSON arguments if necessary
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (err) {
        console.error(`[Error] Failed to parse arguments string: ${args}`);
        args = {};
      }
    }

    console.log(`[TOOL TRIGGERED]: ${name}`);
    console.log(`[ARGUMENTS]:`, JSON.stringify(args, null, 2));

    let result = {};

    switch (name) {
      case 'verify_customer': {
        const { account_id, verification_code } = args;
        const codeClean = String(verification_code || '').trim();

        if (mockDatabase.customer.valid_codes.includes(codeClean)) {
          result = {
            verified: true,
            customer_name: mockDatabase.customer.name,
            account_id: account_id || mockDatabase.customer.account_id,
            overdue_amount: mockDatabase.customer.overdue_amount,
            dpd: mockDatabase.customer.dpd,
            message: 'Identity verified successfully. Access granted.'
          };
          console.log(`✅ [AUTH SUCCESS]: Identity verified for ${mockDatabase.customer.name}`);
        } else {
          result = {
            verified: false,
            message: 'Verification failed. Incorrect PAN digits or birth year.'
          };
          console.log(`❌ [AUTH FAILED]: Verification code '${codeClean}' rejected`);
        }
        break;
      }

      case 'log_promise_to_pay': {
        const { account_id, ptp_date, amount } = args;
        const ptpId = `PTP-${Math.floor(1000 + Math.random() * 9000)}`;

        const record = {
          ptp_id: ptpId,
          account_id: account_id || mockDatabase.customer.account_id,
          ptp_date: ptp_date,
          amount: amount || mockDatabase.customer.overdue_amount,
          logged_at: new Date().toISOString()
        };

        mockDatabase.ptp_records.push(record);

        result = {
          success: true,
          ptp_id: ptpId,
          confirmed_date: ptp_date,
          amount: record.amount,
          message: `Promise-to-Pay logged for ${ptp_date} amounting to ₹${record.amount}`
        };
        console.log(`📝 [PTP LOGGED]:`, record);
        break;
      }

      case 'send_payment_link': {
        const { account_id, channel } = args;
        const channelType = channel || 'SMS';
        const paymentUrl = `https://kapture.fin/pay/acc_${(account_id || '88392').replace(/[^0-9]/g, '')}`;

        const dispatchLog = {
          account_id: account_id || mockDatabase.customer.account_id,
          channel: channelType,
          link: paymentUrl,
          dispatched_at: new Date().toISOString()
        };

        mockDatabase.payment_links_sent.push(dispatchLog);

        result = {
          success: true,
          channel: channelType,
          payment_link: paymentUrl,
          message: `Payment link successfully dispatched via ${channelType} to registered mobile number.`
        };
        console.log(`📲 [PAYMENT LINK DISPATCHED]:`, dispatchLog);
        break;
      }

      case 'mark_disposition': {
        const { account_id, status, notes } = args;

        const dispositionRecord = {
          account_id: account_id || mockDatabase.customer.account_id,
          status: status,
          notes: notes || 'Logged by Maya Voice Agent',
          timestamp: new Date().toISOString()
        };

        mockDatabase.dispositions.push(dispositionRecord);

        result = {
          success: true,
          disposition_logged: status,
          timestamp: dispositionRecord.timestamp,
          message: `Call disposition '${status}' recorded successfully.`
        };
        console.log(`📌 [DISPOSITION LOGGED]:`, dispositionRecord);
        break;
      }

      case 'escalate_to_agent': {
        const { account_id, reason } = args;

        result = {
          success: true,
          transfer_number: '+9118005550199',
          department: reason === 'DISPUTE' ? 'Grievance Resolution Desk' : 'Senior Collections Specialist',
          status: 'TRANSFER_INITIATED',
          message: `Call session queued for escalation due to ${reason}.`
        };
        console.log(`🚨 [ESCALATION TRIGGERED]: Reason = ${reason}`);
        break;
      }

      default:
        result = {
          success: false,
          error: `Unknown function '${name}' requested.`
        };
        console.log(`⚠️ [UNKNOWN TOOL]: ${name}`);
    }

    // Standard Vapi response schema
    const responsePayload = {
      results: [
        {
          toolCallId: callId,
          result: JSON.stringify(result)
        }
      ]
    };

    console.log(`[RESPONSE TO VAPI]:`, JSON.stringify(responsePayload, null, 2));
    return res.status(200).json(responsePayload);
  }

  // Acknowledge non-tool call message events (e.g. transcript, status-update)
  return res.status(200).json({ status: 'acknowledged' });
});

// View Current Database State Endpoint
app.get('/admin/db', (req, res) => {
  res.status(200).json(mockDatabase);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Kapture Finance Mock Webhook Server is RUNNING`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`==================================================\n`);
});
