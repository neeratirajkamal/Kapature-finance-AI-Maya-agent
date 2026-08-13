# 📦 Kapture AI Delivery Intern Assignment — Final Submission Guide

Follow these simple steps to finalize and submit your assignment to the Kapture Finance hiring team.

---

## 📁 Step 1: Repository Structure Check

Ensure your submission folder `kapture-collections-voicebot` contains the following required files:

```text
kapture-collections-voicebot/
├── README.md                   # Setup guide, design choices, debugging log, evaluation
├── docs/
│   ├── HLD_Document.md         # Complete High-Level Design Document with Mermaid diagrams
│   └── SUBMISSION_GUIDE.md     # Turnkey submission checklist
├── vapi/
│   ├── system_prompt.txt       # Production Vapi System Prompt (State machine & persona)
│   ├── tool_definitions.json   # Tool JSON schemas registered in Vapi
│   └── vapi_assistant_config.json # Full Vapi Assistant configuration JSON
├── mock-server/
│   ├── package.json            # Node.js dependencies (express, cors, dotenv)
│   ├── server.js               # Node.js Express webhook server implementation
│   └── public/
│       └── index.html          # Interactive dark-mode Admin & Call Dashboard
└── tests/
    ├── test_cases.json         # Automated evaluation matrix & 8 test scenarios
    └── run_tests.js            # Automated test runner script
```

---

## 🎥 Step 2: Record 2–4 Minute Loom / OBS Demo Video

Record a short video covering the following points:

1. **Dashboard & Webhook Backend Overview (30s)**:
   - Open `http://localhost:3000` in your browser to show the **Maya Collections Operational Dashboard**.
   - Point out customer context: **Rahul Sharma** (`ACC-88392`), **₹8,499** overdue by **12 days**.
2. **Happy Path Demonstration (1–1.5 min)**:
   - Trigger `verify_customer` (Passcode `1234`). Explain how debt disclosure is locked behind this authentication gate.
   - Trigger `log_promise_to_pay` & `send_payment_link`. Show how PTP date and SMS link are dispatched.
   - Show the dynamic update in the **Live Webhook Tool Execution Feed** and **Logged Call Dispositions Table**.
3. **Edge Case Demonstration (1 min)**:
   - Demonstrate an edge case (e.g., `Already Paid`, `Financial Hardship Escalation`, or `Do Not Call`).
   - Show how the disposition badge updates in real-time.
4. **Automated Evaluation Suite Run (30s)**:
   - Open terminal and run `node tests/run_tests.js` to demonstrate **8/8 PASSED test scenarios**.

---

## ✉️ Step 3: Package & Send Submission

1. **Create Zip Archive** or **Push to GitHub**:
   - Option A: Zip the `kapture-collections-voicebot` folder.
   - Option B: Push to a public/private GitHub repository.
2. **Prepare Email Body**:

```text
Subject: Kapture AI Delivery Intern Assignment - [Your Name] - Voice AI Agent ("Maya")

Dear Kapture Finance Hiring Team,

Please find my completed take-home assignment submission for the Voice AI Collections Agent ("Maya").

- HLD Document: Included in /docs/HLD_Document.md
- Vapi System Prompt & Tools: Included in /vapi/
- Webhook Server & Admin Dashboard: Included in /mock-server/
- Loom Demo Recording: [INSERT YOUR LOOM/DRIVE LINK HERE]
- Automated Test Suite: 8/8 evaluation scenarios passed (node tests/run_tests.js)

Best regards,
[Your Name]
```

3. **Send to Hiring Team**: Submit within the given assignment deadline window.
