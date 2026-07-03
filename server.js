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

// Schema
const submissionSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  userEmail:      { type: String, required: true },
  phone:          String,
  linkedIn:       String,
  company:        String,
  overallScore:   Number,
  areasToImprove: [String],
  createdAt:      { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

// POST /submit — save a new form response
app.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, linkedIn, company, overallScore, areasToImprove } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    await Submission.create({ name, userEmail: email, phone, linkedIn, company, overallScore, areasToImprove });
    res.status(201).json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /attendees — list all responses for admin dashboard
app.get('/attendees', async (req, res) => {
  try {
    const data = await Submission.find().sort({ createdAt: -1 }).lean();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
