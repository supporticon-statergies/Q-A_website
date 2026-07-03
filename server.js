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

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /submit
app.post('/submit', async (req, res) => {
  try {
    const {
      name, email, phone, linkedIn, company,
      overallScore, scoreBand, areasToImprove,
      pillarBreakdown, questionAnswers
    } = req.body;

    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

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
