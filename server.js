const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { sendQuoteNotification, sendContactNotification, TARGET_EMAIL } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Path definitions
const DATA_DIR = path.join(__dirname, 'data');
const QUOTES_FILE = path.join(DATA_DIR, 'quotes.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const OUTBOX_FILE = path.join(DATA_DIR, 'email_outbox.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultFallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultFallback, null, 2));
      return defaultFallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultFallback;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve Static Frontend Files
app.use(express.static(__dirname));

/* ---------------- API ENDPOINTS ---------------- */

// 1. Health Check
app.get('/api/health', (req, res) => {
  const quotes = readJsonFile(QUOTES_FILE);
  const contacts = readJsonFile(CONTACTS_FILE);
  const outbox = readJsonFile(OUTBOX_FILE);

  res.json({
    status: 'online',
    agency: 'Infinite Web Solutions API Server',
    targetEmail: TARGET_EMAIL,
    version: '1.1.0',
    uptimeSeconds: Math.floor(process.uptime()),
    metrics: {
      totalQuotes: quotes.length,
      totalContacts: contacts.length,
      totalEmailsDispatched: outbox.length
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Get Portfolio Projects
app.get('/api/projects', (req, res) => {
  const projects = readJsonFile(PROJECTS_FILE);
  res.json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// 3. Process Quote Submission & Trigger Email to infinitewebsolutionss@gmail.com
app.post('/api/quote', async (req, res) => {
  const { name, email, service, addons, estimatedPrice } = req.body;

  if (!name || !email || !service) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, email, and service are mandatory.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address provided.'
    });
  }

  const quotes = readJsonFile(QUOTES_FILE);
  const refId = `IWS-Q-${Math.floor(10000 + Math.random() * 90000)}`;

  const newQuote = {
    id: refId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    service,
    addons: addons || [],
    estimatedPrice: estimatedPrice || '$3,500',
    status: 'Pending Review',
    createdAt: new Date().toISOString()
  };

  quotes.unshift(newQuote);
  const saved = writeJsonFile(QUOTES_FILE, quotes);

  if (!saved) {
    return res.status(500).json({
      success: false,
      error: 'Failed to save quote request to database.'
    });
  }

  // Trigger Email Notification to infinitewebsolutionss@gmail.com
  const emailResult = await sendQuoteNotification(newQuote);

  console.log(`[Quote Processed] Ref #${refId} for ${name} -> Email Notification dispatched to ${TARGET_EMAIL}`);

  res.status(201).json({
    success: true,
    message: `Quote request submitted! Notification sent to ${TARGET_EMAIL}`,
    referenceId: refId,
    targetEmail: TARGET_EMAIL,
    emailResult,
    data: newQuote
  });
});

// 4. Get All Quotes (Admin View)
app.get('/api/quotes', (req, res) => {
  const quotes = readJsonFile(QUOTES_FILE);
  res.json({
    success: true,
    count: quotes.length,
    data: quotes
  });
});

// 5. Process Contact Submission & Trigger Email Notification
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, email, and message are mandatory.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address provided.'
    });
  }

  const contacts = readJsonFile(CONTACTS_FILE);
  const refId = `IWS-C-${Math.floor(10000 + Math.random() * 90000)}`;

  const newContact = {
    id: refId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    service: service || 'General Inquiry',
    message: message.trim(),
    status: 'New',
    createdAt: new Date().toISOString()
  };

  contacts.unshift(newContact);
  const saved = writeJsonFile(CONTACTS_FILE, contacts);

  if (!saved) {
    return res.status(500).json({
      success: false,
      error: 'Failed to save contact message to database.'
    });
  }

  // Trigger Email Notification to infinitewebsolutionss@gmail.com
  const emailResult = await sendContactNotification(newContact);

  console.log(`[Contact Processed] Ref #${refId} for ${name} -> Notification dispatched to ${TARGET_EMAIL}`);

  res.status(201).json({
    success: true,
    message: `Message submitted! Notification sent to ${TARGET_EMAIL}`,
    referenceId: refId,
    targetEmail: TARGET_EMAIL,
    emailResult,
    data: newContact
  });
});

// 6. Get All Contacts (Admin View)
app.get('/api/contact', (req, res) => {
  const contacts = readJsonFile(CONTACTS_FILE);
  res.json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

// 7. View Dispatched Email Outbox (Admin View)
app.get('/api/emails', (req, res) => {
  const outbox = readJsonFile(OUTBOX_FILE);
  res.json({
    success: true,
    targetEmail: TARGET_EMAIL,
    count: outbox.length,
    data: outbox
  });
});

// Fallback route handler
app.use((req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Infinite Web Solutions Server Running on Port ${PORT}`);
  console.log(`📩 Target Notification Email: ${TARGET_EMAIL}`);
  console.log(`🌐 Health API: http://localhost:${PORT}/api/health`);
  console.log(`📧 Sent Emails Outbox API: http://localhost:${PORT}/api/emails`);
  console.log(`📁 Static Web: http://localhost:${PORT}/`);
  console.log(`====================================================`);
});
