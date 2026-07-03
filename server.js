require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizDB';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB.');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Define Mongoose Schema for Submissions
const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: String,
  overall_score: Number,
  areas_to_improve: [String],
  created_at: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Middleware
// We use a wildcard CORS for now so it works when deployed to Render and called from GitHub Pages
app.use(cors({ origin: '*' }));
app.use(express.json());
// Serve static files from the same directory (useful for testing locally)
app.use(express.static(path.join(__dirname))); 

// API to submit a quiz result
app.post('/api/submit', async (req, res) => {
  const { name, email, company, overallScore, areasToImprove } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const newSubmission = new Submission({
      name,
      email,
      company,
      overall_score: overallScore,
      areas_to_improve: areasToImprove || []
    });

    const saved = await newSubmission.save();
    res.status(201).json({ message: 'Submission saved successfully', id: saved._id });
  } catch (err) {
    console.error('Error inserting submission:', err.message);
    res.status(500).json({ error: 'Failed to save submission.' });
  }
});

// API to get all attendees (for the admin dashboard)
app.get('/api/attendees', async (req, res) => {
  try {
    const rows = await Submission.find().sort({ created_at: -1 });
    res.json(rows);
  } catch (err) {
    console.error('Error fetching submissions:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendees.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
