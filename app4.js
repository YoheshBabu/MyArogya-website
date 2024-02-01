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
    currentDay: {
        type: Number,
        default: 1, // default to 1 if not set
    }
});

// Create a mongoose model for the user collection
const User = mongoose.model('User', userSchema);

// Define a mongoose schema for the diet collection
const dietSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    day: { type: Number, required: true },
    calories: { type: Number, required: true },
});

// Create a mongoose model for the diet collection
const Diet = mongoose.model('Diet', dietSchema);

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

// Login route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user in the database
        const user = await User.findOne({ username, password });
/*
        if (user) {
            req.session.user = { _id: user._id, username }; // Store user information in session
            res.redirect('/home');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
*/        
        if (user) {
            req.session.user = user;
            req.session.currentDay = user.currentDay;
            res.redirect('/home');
        } else {
            // handle login failure...
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
            currentDay: 1
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

// Diet page route

app.get('/diet', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.render('diet', { user, nextDay: user.currentDay + 1 });
    } else {
        // handle user not logged in
        res.redirect('/login');
    }
});


// Add this route to handle the current day update
app.post('/updateCurrentDay', (req, res) => {
    const userId = req.session.userId; // Assuming you store user ID in the session
  
    // Find the user in the database
    User.findById(userId, (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // Update the user's current day
        user.currentDay = user.currentDay + 1;
  
        // Save the updated user
        user.save((saveErr, savedUser) => {
          if (saveErr) {
            console.error('Failed to update current day:', saveErr);
            res.status(500).send('Internal Server Error');
          } else {
            console.log('Current day updated successfully');
            res.send('OK');
          }
        });
      }
    });
  });



// Handling form submission for adding diet data
app.post('/addDiet/:userId', async (req, res) => {
    try {
        

        const userId = req.params.userId;
        const user = req.session.user;
        const { day, calories } = req.body;

        console.log('User ID:', userId);
        console.log('User:', user);
        console.log('Day:', day);
        console.log('Calories:', calories);


        console.log('Adding diet data:', { userId, day, calories });

        // Convert calories to a number
        const caloriesToAdd = parseInt(calories, 10);

        // Check if there is an existing document for the given day
        const existingDiet = await Diet.findOne({ userId, day });

        if (existingDiet) {
            // Update existing document
            existingDiet.calories += caloriesToAdd;
            await existingDiet.save();
        } else {
            // Create a new document
            const newDietEntry = new Diet({
                userId,
                username: user.username,
                day,
                calories: caloriesToAdd,
            });
            await newDietEntry.save();
        }

        // Redirect to stats page or another appropriate page
        res.redirect('/stats');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Stats route
app.get('/stats', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            const userId = req.session.user._id;

            const dietData = await Diet.find({ userId });

            res.render('stats', { user, dietData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.redirect('/');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.redirect('/');
        }
    });
});

// ... (other routes)

// Listen on PORT
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
