# Kapture Finance - Outbound Voice AI Collections Agent ("Maya")

An automated, compliant, outbound Voice AI Collections Agent built on **Vapi.ai**, powered by **Deepgram Nova-2 STT**, **OpenAI GPT-4o LLM**, **ElevenLabs/Cartesia TTS**, and a **Node.js Express Webhook Server**.

---

## 📌 Executive Summary

"Maya" is designed for **Kapture Finance** to handle high-volume outbound loan collection calls politely, compliantly, and autonomously.

### Core Business & Technical Highlights:
- **Strict Compliance Engine:** Zero-debt disclosure before 2-factor identity authentication (`verify_customer`).
- **Low-Latency Budget:** Target $<1.2\text{s}$ total voice-to-voice round-trip latency.
- **Actionable Tool Integration:** 5 RESTful webhooks (`verify_customer`, `log_promise_to_pay`, `send_payment_link`, `mark_disposition`, `escalate_to_agent`).
- **RBI Fair Practices Compliance:** Respects calling hours (08:00 AM – 07:00 PM), zero third-party disclosure, instant Do-Not-Call (DNC) opt-out execution.
- **Bilingual Capabilities:** Seamless mid-call English $\leftrightarrow$ Hindi / Hinglish code-switching.

---

## 📁 Repository Structure

```
kapture-collections-voicebot/
├── README.md                   # Setup guide, design choices, debugging log, evaluation
├── docs/
│   └── HLD_Document.md         # Comprehensive High-Level Design Document with Mermaid diagrams
├── vapi/
│   ├── system_prompt.txt       # Production Vapi System Prompt (State machine & persona)
│   └── tool_definitions.json   # Standard JSON schemas registered on Vapi dashboard
├── mock-server/
│   ├── package.json            # Node.js dependencies (express, cors, dotenv)
│   ├── server.js               # Node.js Express webhook server implementation
│   └── .env.example            # Environment variable template
└── tests/
    └── test_cases.json         # Automated evaluation matrix & 8 test scenarios
```

---

## 🛠️ Technology Stack & Selection Rationale

| Component | Selected Technology | Why Chosen? |
| :--- | :--- | :--- |
| **Voice Orchestrator** | **Vapi.ai** | Provides sub-second WebRTC audio streaming, state orchestration, and native tool-calling integration. |
| **Speech-to-Text (STT)**| **Deepgram Nova-2** | Sub-200ms latency, optimized for telephony audio, superior accuracy on Indian names & accents. |
| **LLM Engine** | **OpenAI `gpt-4o`** | High function-calling reliability, fast first-token time ($\sim 350\text{ms}$), strong instruction following. |
| **Text-to-Speech (TTS)**| **Cartesia / ElevenLabs** | Natural conversational tone, low-latency streaming ($\sim 220\text{ms}$), realistic expressiveness. |
| **Webhook Backend** | **Node.js Express** | Lightweight, event-driven handling of HTTP POST tool requests from Vapi. |
| **Tunneling Tool** | **ngrok** | Exposes local development server port 3000 to public HTTPS for Vapi webhook calls. |

---

## 🚀 Quickstart & Setup Guide

### Step 1: Clone & Install Webhook Backend
```bash
cd mock-server
npm install
npm start
```
The server will boot on `http://localhost:3000` and display:
```
🚀 Kapture Finance Mock Webhook Server is RUNNING
📡 Listening on: http://localhost:3000
```

### Step 2: Expose Public HTTPS Webhook via Tunneling
In a separate terminal window, run either:
```bash
# Zero-install method (Recommended):
npx localtunnel --port 3000

# Or via npm script:
npm run tunnel

# Or if you have ngrok installed:
npx ngrok http 3000
```
Copy the generated HTTPS Forwarding URL (e.g. `https://a1b2c3d4.loca.lt` or `https://a1b2c3d4.ngrok-free.app`). Your live webhook endpoint will be:
`https://<your-subdomain>.loca.lt/webhook` (or `/webhook` on your ngrok URL)

---

## 🎙️ Vapi Dashboard Configuration Guide

1. Log into your [Vapi Dashboard](https://dashboard.vapi.ai).
2. Navigate to **Assistants** $\rightarrow$ Click **Create Assistant** (Select Blank Template).
3. **Model & Provider Configuration:**
   - **Transcriber:** Deepgram | Model: `nova-2` | Language: `en-US` (or `multi`)
   - **Model:** OpenAI | Model: `gpt-4o` | Temperature: `0.1`
   - **Voice:** ElevenLabs / Cartesia | Model: `sonic-english` / `eleven_turbo_v2` | Voice: Female Professional (e.g. "Sarah")
4. **First Message:**
   ```text
   Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?
   ```
5. **System Prompt:**
   - Open `vapi/system_prompt.txt` from this repository and paste the entire contents into the Vapi Assistant **System Prompt** box.
6. **Register Tools / Functions:**
   - Navigate to **Tools** tab in Vapi.
   - Click **Create Tool** for each function in `vapi/tool_definitions.json`.
   - Set Server URL to your ngrok URL: `https://a1b2c3d4.ngrok-free.app/webhook`.

---

## 🧪 Testing & Validation Matrix

Execute calls using Vapi Web Call or Phone Call to validate all scenarios in `tests/test_cases.json`:

### Scenario 1: Happy Path (Promise to Pay - PTP)
1. **Maya:** "Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?"
2. **User:** "Yes, speaking."
3. **Maya:** "For account security purposes, could you please confirm the last 4 digits of your PAN card or your year of birth?"
4. **User:** "My PAN digits are 1234." *(Maya triggers `verify_customer` tool $\rightarrow$ returns verified: true)*
5. **Maya:** "Thank you for verifying, Rahul. An EMI of ₹8,499 is overdue by 12 days. Can you pay this today?"
6. **User:** "I will pay this Friday." *(Maya triggers `log_promise_to_pay` & `send_payment_link`)*
7. **Maya:** "Thank you! I have logged your promise to pay for Friday and sent an SMS link." *(Maya triggers `mark_disposition(PTP_AGREED)` and concludes call)*

### Scenario 2: Edge Case (Already Paid via UPI)
1. User authenticates with `1234`.
2. User: "I already paid yesterday via Google Pay!"
3. **Maya:** Asks for details, triggers `mark_disposition(status: "ALREADY_PAID")`, advises 24-48h processing, and ends call.

### Scenario 3: Edge Case (Do Not Call Request)
1. User: "Stop calling me! Remove my number!"
2. **Maya:** Triggers `mark_disposition(status: "DO_NOT_CALL")`, acknowledges opt-out, and ends call immediately.

---

## 📝 Debugging Log & Lessons Learned

| Problem / Bug Encountered | Root Cause | Engineering Solution Implemented |
| :--- | :--- | :--- |
| **Premature Debt Disclosure** | LLM revealed overdue amount when asked *"Why are you calling?"* in turn 1. | Applied strict negative prompt constraint: *"Zero-debt-disclosure before verify_customer returns verified: true"*. Locked prompt behind State 0/1. |
| **Malformed Tool Arguments** | Vapi occasionally passed JSON arguments stringified as `"{ \"verification_code\": \"1234\" }"`. | Added robust stringified JSON parser in `server.js` (`JSON.parse` fallback handler). |
| **High Latency (>2s)** | STT silence threshold was default $800\text{ms}$. | Reduced Deepgram endpointing to $400\text{ms}$ and switched LLM model to streaming tokens. |
| **Hinglish Date Parsing Failure** | User saying "Perso pay karunga" resulted in invalid ISO date. | Instructed prompt to convert relative terms ("perso" = +2 days) into explicit ISO-8601 strings. |

---

## 🔮 Scalability & Future Enhancements

1. **HMAC Signature Authentication:** Enforce webhook signature validation (`x-vapi-signature`) to secure backend API endpoints.
2. **Real SMS/WhatsApp Integration:** Connect Twilio/Meta WhatsApp Business API in `send_payment_link` for instant tokenized payment links.
3. **Automated LLM Eval Suite:** Run regression evals using `braintrust` or `promptfoo` across 100+ test transcript variations prior to production deployment.
4. **CRM Synchronization:** Push call recordings, STT transcripts, and disposition codes into Salesforce / LMS asynchronously via Kafka messaging.
