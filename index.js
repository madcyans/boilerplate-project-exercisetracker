const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// In-memory storage for users and their exercise logs
// Each user will be stored as { username: String, _id: String, log: Array }
const users = [];

// Utility function to create a unique ID for users
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Root route – now GET "/" will not produce an error
app.get('/', (req, res) => {
  res.send("Welcome to the Exercise Tracker API!");
});

// POST /api/users – Create a new user
app.post('/api/users', (req, res) =>{
  const username = req.body.username;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  } 

// Check for existing user
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.json({ username: existingUser.username, _id: existingUser._id });
  }

  const newUser = {
    username,
    _id: generateId(),
    log: []
  };

  users.push(newUser);
  res.json({ username: newUser.username, _id: newUser._id });
});

// 2. GET /api/users - Retrieve a list of all users
app.get("/api/users", (req, res) => {
  // Only return the username and _id for each user
  const simplifiedUsers = users.map((user) => ({
    username: user.username,
    _id: user._id
  }));
  res.json(simplifiedUsers);
});

// 3. POST /api/users/:_id/exercises - Add an exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: "Description and duration are required" });
  }

  const user = users.find((user) => user._id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Convert duration to a number
  const durationNum = parseInt(duration);

  // If date is provided, use it; otherwise, default to the current date
  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    if (exerciseDate.toString() === "Invalid Date") {
      return res.status(400).json({ error: "Invalid date format" });
    }
  } else {
    exerciseDate = new Date();
  }

  const exercise = {
    description,
    duration: durationNum,
    date: exerciseDate
  };

  user.log.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  });
});

// 4. GET /api/users/:_id/logs - Retrieve a user's exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  let { from, to, limit } = req.query;

  const user = users.find((user) => user._id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let log = user.log.slice(); // Clone the log array to avoid mutating the original data

  // Filter logs by the "from" date if provided
  if (from) {
    const fromDate = new Date(from);
    if (fromDate.toString() === "Invalid Date") {
      return res.status(400).json({ error: "Invalid 'from' date format" });
    }
    log = log.filter((entry) => new Date(entry.date) >= fromDate);
  }

  // Filter logs by the "to" date if provided
  if (to) {
    const toDate = new Date(to);
    if (toDate.toString() === "Invalid Date") {
      return res.status(400).json({ error: "Invalid 'to' date format" });
    }
    log = log.filter((entry) => new Date(entry.date) <= toDate);
  }

  // Apply limit if provided
  if (limit) {
    limit = parseInt(limit);
    log = log.slice(0, limit);
  }

  // Format the log entries to display the date as a string
  const formattedLog = log.map((entry) => ({
    description: entry.description,
    duration: entry.duration,
    date: new Date(entry.date).toDateString()
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: formattedLog.length,
    log: formattedLog
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
