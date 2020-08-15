const {
  addRecipe: addRecipeQuery,
  getAllRecipes: getAllRecipesQuery,
} = require('../queries/recipe.js');

// Gets all recipes from the database
// Returns all data from @recipes plus an array of tags (no ingredients or steps)
// TODO: Add query parameter for limit+offset
const getAllRecipes = async (request, response) => {
  const result = await getAllRecipesQuery();
  const status = result.error ? 400 : 200;
  return response.status(status).json(result);
};

// Adds a new recipe based on the data sent in request.body
// Returns @id and @title of the new recipe on success
// Returns @error with @message and optional @detalils keys on error
const addRecipe = async (request, response) => {
  const userReq = request.body;

  if (!userReq.title) {
    return response.status(400).json({ error: { message: "'title' is required" } });
  }

  if (!userReq.submittedBy) {
    return response.status(400).json({ error: { message:"'submittedBy' is required" }});
  }

  if (!userReq.category) {
    return response.status(400).json({ error: { message:"'category' is required" }});
  }

  if (!userReq.ingredients || !userReq.ingredients.length) {
    return response.status(400).json({ error: { message:"At least one ingredient is required" }});
  }

  if (!Array.isArray(userReq.ingredients)) {
    return response.status(400).json({ error: { message:"Type Error: 'ingredients' must be an array" }});
  }

  if (!userReq.steps || !userReq.steps.length) {
    return response.status(400).json({ error: { message:"At least one step is required" }});
  }

  if (!Array.isArray(userReq.steps)) {
    return response.status(400).json({ error: { message:"Type Error: 'steps' must be an array" }});
  }

  if (userReq.tags && !Array.isArray(userReq.tags)) {
    return response.status(400).json({ error: { message:"Type Error: 'tags' must be an array" }});
  }

  const result = await addRecipeQuery(userReq);
  console.log(result);
  if (result.error) {
    return response.status(400).json({
      error: {
        message: result.error.message,
        details: result.error.details
      }
    });
  }
  return response.status(200).json({ id: result.recipe_id, title: userReq.title });
};

module.exports = {
  addRecipe,
  getAllRecipes,
};