import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import * as Recipe from './controllers/recipe';
import * as User from './controllers/user';
import { isAuthenticated } from './middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URL = process.env.MONGODB_URL;

// Middleware
app.use(helmet());
app.use(express.json());

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

// MongoDB connection
connectToMongo();

// Routes
app.get('/', (request, response) => {
  response.json({ info: 'Node.js and MongoDB API for storing family recipes.' });
});

// Recipe Routes
app.get('/recipes', Recipe.getAllRecipes);
app.get('/recipe/:id', Recipe.getRecipeById);
app.post('/recipe/new', Recipe.createRecipe); // TODO: Require auth and send it in request
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
// app.put('/user/:id', isAuthenticated, User.updateUser);
// app.delete('/user/:id', isAuthenticated, User.deleteUser);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function connectToMongo() {
  try {
    console.log('Connecting to MongoDB... with URL:', MONGODB_URL);
    await mongoose.connect(MONGODB_URL!);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
