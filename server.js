const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
  secret: process.env.SESSION_SECRET || 'redclosetsecret', // use env var for security
  resave: false,
  saveUninitialized: true
}));

// ✅ Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGO_URI)

  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { user: req.session.user });
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Error registering user');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      res.redirect('/dashboard');
    } else {
      res.send('Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    res.send('Error logging in');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ✅ Use Render’s PORT environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Red Closet running on port ${PORT}`));
