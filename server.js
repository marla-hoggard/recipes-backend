require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8000;

const { isAuthenticated } = require('./middleware.js');
const Recipe = require('./models/recipe.js');
const User = require('./models/user.js');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const allowedOrigins = [
  process.env.FRONTEND_BASE_URL_LOCAL,
  process.env.FRONTEND_BASE_URL_IP,
  process.env.FRONTEND_BASE_URL_PROD,
].map((domain) => new RegExp(`https?${(domain || '').replace(/https?/, '')}`));

const corsOptions = {
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'Node.js and PostgreSQL API for storing family recipes.' });
});

// Recipe Routes
app.get('/recipes', Recipe.getAllRecipes);
app.get('/recipe/:id', Recipe.getRecipe);
app.post('/recipe/new', Recipe.addRecipe); // TODO: Require authentication
app.put('/recipe/:id', Recipe.editRecipe); // TODO: Require auth and that user is admin or matches "submitted by"
app.get('/search', Recipe.searchRecipes);

app.get('/categories', Recipe.listCategories);
app.get('/tags', Recipe.listTags);
app.get('/submitters', Recipe.listSubmitters);

// User Routes
app.post('/signup', User.signup);
app.post('/signin', User.signin);
app.post('/signout', isAuthenticated, User.signout);
app.get('/user', User.getUserProfile);
app.put('/user/:id', isAuthenticated, User.updateUser);
app.delete('/user/:id', isAuthenticated, User.deleteUser);

// Start the app on the right port
app.listen(port, () => {
  console.log(`App running on port ${port}.`);
  console.log(`The env port is: ${process.env.PORT}`);
  console.log(`The environment is: ${process.env.NODE_ENV}`);
  console.log(`frontend base url prod is: ${process.env.FRONTEND_BASE_URL_PROD}`);
});
