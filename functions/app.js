const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const serverless=require('serverless-http');

const app = express();
const PORT = process.env.PORT || 3000;

const uri = "mongodb+srv://YoheshBabu:Yohesh%40007@cluster0.udzbkx5.mongodb.net/MyArogya?retryWrites=true&w=majority";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(uri, options)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error.message);
  });




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
    username: { type: String, required: false },
    day: { type: Number, required: false },
    calories: { type: Number, required: false },
   
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


app.set('view engine', 'ejs');

// Define the directory where your EJS files are located

// Define routes


app.get('/', (req, res) => {
    res.render('login', { error: null });
});
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.get('/aboutus', (req, res) => {
    res.render('aboutus', { error: null });
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

const foodSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: Number},
    meals: [{ type: String }] // Array to store selected meals
});

const Food = mongoose.model('Food', foodSchema);

const weightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    day: { type: Number, required: true },
    weight: { type: Number, required: true },
});
const Weight = mongoose.model('Weight', weightSchema);

module.exports = Weight;


app.get('/signup', (req, res) => {
    res.render('login');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'C:/Users/yohes/OneDrive/Desktop/Front gamma/public/uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'profilePic-' + uniqueSuffix + '.jpeg');
    },
});
  
  const upload = multer({ storage: storage });
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(__dirname + '/public'));
  app.set('view engine', 'ejs');
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));
app.post('/signup',upload.single('profilePic'), async (req, res) => {
    try {
        // Extract user data from the request body
        const { email, password, username, age, riskLevel, level, goalDuration, height, weight, goal } = req.body;

        // Check if the username is already taken
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            // Username already exists, handle accordingly
            return res.render('signup', { error: 'Username is already taken' });
        }

        // Create a new User instance
        const newUser = new User({
            // ... (existing user properties)
            
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

        // Create food, diet, and workout collections for the user
        const userId = newUser._id;
        await Food.create({ userId, day: 1 }); // Provide the day value

await Diet.create({ userId, day: 1, calories: 0, username: 'your_username' });

// Modify the following line to provide the required fields
await Workout.create({ userId, day: 1 });

                // Redirect to the home page after successful signup
        res.redirect('/login');
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

const path = require('path');

// Set storage engine




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

// Inside the route handling the /diet endpoint

app.get('/diet', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            const userId = user._id;
            const curday=user.currentDay
            // Fetch meal data
            const userMeals = await Food.findOne({ userId,day:curday });
            const userCals = await Diet.findOne({ userId,day:curday });
            if(!userCals)
            {
                await Diet.create({ userId, day: user.currentDay, calories: 0, username: 'default_username' });

            }


            const w=parseInt(user.weight);
            const h=parseInt(user.height);
            const a=parseInt(user.age);
            
            const bmr=(10*w)+(6.25*h)-(5*a)+5;
            var mc=bmr*1.25;
            const uc = userCals ? userCals.calories : 0; // Add a null check here
            
           
            // Render the diet page with the user and meal data
            res.render('diet', { user,userCals,uc,mc, userMeals, nextDay: user.currentDay + 1 });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // handle user not logged in
        res.redirect('/login');
    }
});

app.get('/getCalories', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            const userId = user._id;
            const curday = user.currentDay;

            // Fetch calories data for the current day
            const userCals = await Diet.findOne({ userId, day: curday });

            if (userCals) {
                res.json({ calories: userCals.calories });
            } else {
                res.status(404).json({ error: 'Calories data not found for the current day' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // Handle user not logged in
        res.status(401).json({ error: 'User not logged in' });
    }
});

// Add this route to handle the current day update
// Add this route to handle the current day update
// Add this route to handle the current day update and redirect to login page
app.post('/updateCurrentDay', async (req, res) => {
    const userId = req.session.user._id;
    const cd=userId.currentDay;
    try {
        // Find the user in the database and update the current day
        const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { currentDay: 1 } }, { new: true });
        const updatedFood = await Food.findByIdAndUpdate(userId, { $inc: { day: 1 } }, { new: true },{meals:[]});
        
        if (!updatedUser) {
            console.error('User not found');
            res.status(404).send('User not found');
            return;
        }

        console.log('Current day updated successfully');
        req.session.user = updatedUser; // Update the user in the session
        req.session.userMeals=updatedFood;
        await req.session.save(); // Save the session before redirecting

        // Redirect to the login page
        res.redirect('/');
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

        const { calories, quantity, weight, meal } = req.body;

        const foodEntry = await Food.findOneAndUpdate(
            { userId, day },
            { $push: { meals: meal } },
            { upsert: true, new: true }
        );


        


        // Convert calories to a number
        const w=parseInt(weight);
        const totcal = parseInt(calories) * parseInt(quantity);
        const caloriesToAdd = parseInt(totcal, 10);

        // Check if there is an existing document for the given day
        const existingDiet = await Diet.findOne({ userId, day });
        const existingWeight = await Weight.findOne({ userId, day });
        
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

        if (existingWeight) {
            // Update existing document
            existingWeight.weight = weight;
            await existingWeight.save();
        } else {
            // Create a new document
            const newWeightEntry = new Weight({
                userId,
                username: user.username,
                day,
                weight: parseFloat(weight), // Ensure weight is converted to a number
            });
            await newWeightEntry.save();
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
// Stats route
app.get('/stats', async (req, res) => {
    const user = req.session.user;
    if (user) {
        try {
            const userId = user._id;

            // Fetch diet data
            const dietData = await Diet.find({ userId });

            // Fetch workout data
            const workoutData = await Workout.find({ userId });
            const weightData = await Weight.find({ userId });

        
            res.render('stats', { user, dietData, workoutData, weightData });
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
app.get('/workout1', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.render('workout1', { user, nextDay: user.currentDay + 1 });
    } else {
        // handle user not logged in
        res.redirect('/login');
    }
});
app.get('/workout2', (req, res) => {
    const user = req.session.user;
    const day=user.currentDay;
    if (user) {
        if(user.riskLevel=="high" || user.riskLevel=="yes" || user.age>40)
        {
            res.render('workout', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%7==0 )
        {
            res.render('workout6', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%6==0)
        {
            res.render('workout5', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%5==0)
        {
            res.render('workout4', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%4==0)
        {
            res.render('workout3', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%3==0)
        {
            res.render('workout2', { user, nextDay: user.currentDay + 1 });
        }
        else if(day%2==0)
        {
            res.render('workout1', { user, nextDay: user.currentDay + 1 });
        }
        else 
        {
            res.render('workout1', { user, nextDay: user.currentDay + 1 });
        }






        
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
        res.redirect('/');
    } catch (error) {
        console.error('Failed to update current day:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.use('/.netlify/functions/api',router);
module.exports.handler=serverless(app);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
