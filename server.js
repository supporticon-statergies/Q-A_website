const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

// ── Schema ────────────────────────────────────────────────────────────────────

const questionAnswerSchema = new mongoose.Schema({
  pillarId:       String,
  pillarTitle:    String,
  questionIndex:  Number,
  questionText:   String,
  tag:            String,
  selectedAnswer: String,
  score:          Number
}, { _id: false });

const pillarBreakdownSchema = new mongoose.Schema({
  pillarId:   String,
  title:      String,
  score:      Number,
  maxScore:   Number,
  percentage: Number
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  // Contact info
  name:           { type: String, required: true },
  userEmail:      { type: String, required: true },
  phone:          String,
  linkedIn:       String,
  company:        String,

  // Overall result
  overallScore:   Number,
  scoreBand:      String,
  areasToImprove: [String],

  // Full report
  pillarBreakdown:  [pillarBreakdownSchema],
  questionAnswers:  [questionAnswerSchema],

  createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

function isValidWorkEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  if (!emailRegex.test(email)) return false;

  const domain = email.split('@')[1]?.toLowerCase();
  const blockedDomains = [
    'gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 'live.com',
    'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com',
    'zoho.com', 'yandex.com', 'rediffmail.com', 'mail.com', 'gmx.com'
  ];

  return !!domain && !blockedDomains.includes(domain) && domain === 'company.com';
}

function isValidPhoneNumber(phone) {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s()\-]/g, '');
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;
  return phoneRegex.test(cleanPhone);
}

function isValidLinkedIn(linkedIn) {
  if (!linkedIn) return true;
  const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company|school)\/[A-Za-z0-9\-_%]+\/?$/i;
  return linkedInRegex.test(linkedIn);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /submit
app.post('/submit', async (req, res) => {
  try {
    const {
      name, email, phone, linkedIn, company,
      overallScore, scoreBand, areasToImprove,
      pillarBreakdown, questionAnswers
    } = req.body;

    if (!name || !email || !company || !phone) {
      return res.status(400).json({ error: 'Name, email, company, and phone are required.' });
    }
    if (!isValidWorkEmail(email)) {
      return res.status(400).json({ error: 'Please use your company email address. Personal email providers are blocked.' });
    }
    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({ error: 'Please enter a valid mobile number with country code.' });
    }
    if (linkedIn && !isValidLinkedIn(linkedIn)) {
      return res.status(400).json({ error: 'Please enter a valid LinkedIn URL — e.g. https://linkedin.com/in/yourname.' });
    }

    await Submission.create({
      name, userEmail: email, phone, linkedIn, company,
      overallScore, scoreBand, areasToImprove,
      pillarBreakdown, questionAnswers
    });

    res.status(201).json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /attendees — summary list for admin table
app.get('/attendees', async (req, res) => {
  try {
    const data = await Submission.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /attendees/:id — full report for a single submission
app.get('/attendees/:id', async (req, res) => {
  try {
    const doc = await Submission.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
