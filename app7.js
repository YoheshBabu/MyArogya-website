const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/gamma2', { useNewUrlParser: true, useUnifiedTopology: true });

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
        default: 1,
    }
});

const User = mongoose.model('User', userSchema);

const dietSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    day: { type: Number, required: true },
    calories: { type: Number, required: true },
});

const Diet = mongoose.model('Diet', dietSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

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

app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });

        if (user) {
            req.session.user = user;
            req.session.currentDay = user.currentDay;
            res.redirect('/home');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', upload.single('profilePic'), async (req, res) => {
  try {
      // Extract user data from the request body
      const { email, password, username, age, riskLevel, level, goalDuration, height, weight, goal } = req.body;

      // Check if the username is already taken
      const existingUser = await User.findOne({ username });

      if (existingUser) {
          // Username already exists, handle accordingly (you may want to redirect to the signup page with an error message)
          return res.render('signup', { error: 'Username is already taken' });
      }

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
      res.status(500).render('signup', { error: 'Internal Server Error' });
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
// Add this route to handle the current day update
// Add this route to handle the current day update
app.post('/updateCurrentDay', async (req, res) => {
    const userId = req.session.user._id;

    try {
        // Find the user in the database and update the current day
        const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { currentDay: 1 } }, { new: true });

        if (!updatedUser) {
            console.error('User not found');
            res.status(404).send('User not found');
            return;
        }

        console.log('Current day updated successfully');
        req.session.user = updatedUser; // Update the user in the session
        await req.session.save(); // Save the session before redirecting
        res.redirect('/diet'); // Redirect to the diet page (you can change this as needed)
    } catch (error) {
        console.error('Failed to update current day:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/addDiet/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = req.session.user;
        const day = user.currentDay; // Get the day from the user's currentDay

        const { calories } = req.body;

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
// Stats route
// Stats route
app.get('/stats', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            const userId = req.session.user._id;

            // Fetch diet data for the specific user
            const dietData = await Diet.find({ userId });

            // Extracting days and calories from dietData
            const days = dietData.map(entry => entry.day);
            const calories = dietData.map(entry => entry.calories);

            res.render('stats', { user, dietData: { days, calories } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.redirect('/');
    }
});




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


const workoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: Number, required: true },
    noWork: { type: Number, default: 0 }
});

// Create a mongoose model for the workout collection
const Workout = mongoose.model('Workout', workoutSchema);

// ... (other middleware and configurations)

// Workout page route
app.get('/workout', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.render('workout', { user, nextDay: user.currentDay + 1 });
    } else {
        // handle user not logged in
        res.redirect('/login');
    }
});

// Handling form submission for adding workout data
app.post('/addWorkout/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = req.session.user;
        const day = user.currentDay;

        // Extract workout data from the request body
        const workouts = Object.keys(req.body).map(key => parseInt(key.split('_')[1]));

        console.log('User ID:', userId);
        console.log('User:', user);
        console.log('Day:', day);
        console.log('Workouts selected:', workouts);

        // Find or create a workout document for the user and day
        let workout = await Workout.findOne({ userId, day });

        if (!workout) {
            workout = new Workout({ userId, day });
        }

        // Update the noWork count for each selected workout
        workouts.forEach(async (workoutNumber) => {
            workout.noWork += 1; // Increment count for each workout selected
        });

        // Save the updated workout document
        await workout.save();

        res.redirect('/home'); // Redirect to home or another page after submission
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/nextDay', async (req, res) => {
    const userId = req.session.user._id;

    try {
        // Find the user in the database and update the current day
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the user's current day
        user.currentDay = user.currentDay + 1;

        // Save the updated user
        await user.save();

        console.log('Current day updated successfully');
        
        // Redirect to the referring page or another appropriate page
        res.redirect(req.get('referer'));
    } catch (error) {
        console.error('Failed to update current day:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
