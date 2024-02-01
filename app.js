const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/gamma2', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a mongoose schema for the user collection
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    age: Number,
    riskLevel: String,
    level: String,
    goalDuration: String,
    height: String,
    weight: String,
    goal: String,
    profilePic: String,
});

// Create a mongoose model for the user collection
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ username, password });

        if (user) {
            req.session.user = { username }; // Store user information in session
            res.redirect('/home');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Signup route should come before the route that renders the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', upload.single('profilePic'), async (req, res) => {
    try {
        // Extract user data from the request body
        const { email, password, username, age, riskLevel, level, goalDuration, height, weight, goal } = req.body;

        // Create a new User instance
        const newUser = new User({
            email,
            password,
            username,
            age,
            riskLevel,
            level,
            goalDuration,
            height,
            weight,
            goal,
            profilePic: req.file ? req.file.filename : null,
        });

        // Save the user to the database
        await newUser.save();

        // Redirect to the home page after successful signup
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/home', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.render('home', { user });
    } else {
        res.redirect('/');
    }
});

app.get('/profile', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            // Assuming you are using the username to retrieve user data, update accordingly
            const foundUser = await User.findOne({ username: user.username }).exec();

            if (foundUser) {
                res.render('profile', { user: foundUser });
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.redirect('/');
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
