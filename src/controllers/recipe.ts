import Recipe, { Category, IRecipe } from '../models/recipe';
import { AuthedRequest, OpenRequest, Response } from '../types';

/**
 * Returns all recipes, sorted alphabetically by title.
 */
export const getAllRecipes = async (req: OpenRequest, res: Response) => {
  const recipes = await Recipe.find({}).sort({ title: 1 }).lean();
  return res.status(200).json({ data: recipes });
};

/**
 * Returns a single recipe by its postgres `recipe.id` field.
 * Throw a 404 if not found.
 *
 * TODO: Consider using _id or slug and getting rid of the legacy id field
 */
export const getRecipeById = async (req: OpenRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid recipe ID' });
  }

  // TODO: Consider using _id or slug and getting rid of the legacy id field
  const result = await Recipe.findOne({ id }).lean();
  if (result) {
    return res.status(200).json(result);
  }
  return res.status(404).json({ error: 'Recipe not found' });
};

export const createRecipe = async (req: AuthedRequest, res: Response) => {
  if (!req.body.title) {
    return res.status(400).json({ error: { message: "'title' is required" } });
  }

  if (!req.body.submitted_by) {
    return res.status(400).json({ error: { message: "'submitted_by' is required" } });
  }

  if (!req.body.category) {
    return res.status(400).json({ error: { message: "'category' is required" } });
  }

  if (!req.body.ingredients || !req.body.ingredients.length) {
    return res.status(400).json({ error: { message: 'At least one ingredient is required' } });
  }

  if (!Array.isArray(req.body.ingredients)) {
    return res.status(400).json({ error: { message: "Type Error: 'ingredients' must be an array" } });
  }

  if (!req.body.steps || !req.body.steps.length) {
    return res.status(400).json({ error: { message: 'At least one step is required' } });
  }

  if (!Array.isArray(req.body.steps)) {
    return res.status(400).json({ error: { message: "Type Error: 'steps' must be an array" } });
  }

  if (req.body.tags && !Array.isArray(req.body.tags)) {
    return res.status(400).json({ error: { message: "Type Error: 'tags' must be an array" } });
  }

  if (req.body.tags && req.body.tags.some((el: any) => typeof el !== 'string')) {
    return res.status(400).json({ error: { message: "Type Error: All 'tags' must be of type string" } });
  }

  if (req.body.footnotes && !Array.isArray(req.body.footnotes)) {
    return res.status(400).json({ error: { message: "Type Error: 'footnotes' must be an array" } });
  }

  if (req.body.source && typeof req.body.source !== 'string') {
    return res.status(400).json({ error: { message: "Type Error: 'source' must be a string" } });
  }

  if (req.body.source_url && typeof req.body.source_url !== 'string') {
    return res.status(400).json({ error: { message: "Type Error: 'source_url' must be a string" } });
  }

  const lastId = await Recipe.findOne({}).sort({ id: -1 }).select('id').lean();

  const newRecipe: Omit<IRecipe, '_id' | 'created_at'> = {
    id: lastId ? lastId.id + 1 : 1, // TODO: Consider getting rid of this field
    title: req.body.title,
    source: req.body.source || null,
    source_url: req.body.source_url || null,
    submitted_by: req.body.submitted_by,
    servings: req.body.servings || null,
    category: req.body.category,
    vegetarian: req.body.vegetarian ?? false,
    featured: req.body.featured ?? false,
    ingredients: req.body.ingredients,
    steps: req.body.steps,
    tags: req.body.tags || [],
    footnotes: req.body.footnotes || [],
  };

  const result = await Recipe.insertOne(newRecipe);
  if (!result) {
    return res.status(400).json({
      message: 'Error creating recipe. Please check the data and try again.',
    });
  }
  return res.status(200).json({ id: result.id, title: result.title });
};

export const editRecipe = async (req: AuthedRequest, res: Response) => {
  // TODO: Use _id or slug and get rid of the legacy id field
  const id = parseInt(req.params.id);

  if (!Object.keys(req.body).length) {
    return res.status(400).json({ error: { message: 'You must include data to update in the request body.' } });
  }

  if (req.body.tags && !Array.isArray(req.body.tags)) {
    return res.status(400).json({ error: { message: "Type Error: 'tags' must be an array" } });
  }

  if (req.body.tags && req.body.tags.some((el: any) => typeof el !== 'string')) {
    return res.status(400).json({ error: { message: "Type Error: All 'tags' must be of type string" } });
  }

  if (req.body.ingredients && !Array.isArray(req.body.ingredients)) {
    return res.status(400).json({ error: { message: "Type Error: 'ingredients' must be an array" } });
  }

  if (req.body.steps && !Array.isArray(req.body.steps)) {
    return res.status(400).json({ error: { message: "Type Error: 'steps' must be an array" } });
  }

  if (req.body.source && typeof req.body.source !== 'string') {
    return res.status(400).json({ error: { message: "Type Error: 'source' must be a string" } });
  }

  if (req.body.source_url && typeof req.body.source_url !== 'string') {
    return res.status(400).json({ error: { message: "Type Error: 'source_url' must be a string" } });
  }

  const updatedRecipe = Object.fromEntries(
    Object.entries(req.body).filter(([key]) =>
      [
        'title',
        'source',
        'source_url',
        'submitted_by',
        'servings',
        'category',
        'vegetarian',
        'featured',
        'tags',
        'footnotes',
        'ingredients',
        'steps',
      ].includes(key)
    )
  );

  const result = await Recipe.findOneAndUpdate({ id }, { $set: updatedRecipe }, { new: true });
  if (!result) {
    return res.status(404).json({
      message: 'Recipe not found. Please check the ID and try again.',
    });
  }
  return res.status(200).json({ id: result.id, title: result.title });
};

/**
 *
 * Returns the list of recipes that match the provided search params, ordered by title
 * All search params come in via query string.
 * All string searches should be case insensitve.
 * @param.all: boolean -> Whether recipes need to match ALL or ANY of the search terms - default: false (ANY)
 * @param.wildcard -> Search title, ingredients/notes, step, tags and footnotes for the term
 * @param.limit -> Optionally limit to that number
 * @param[column_name] -> Searches the given column for matches
 *  Supports: title, source, submitted_by, category, vegetarian
 *             featured, step, footnote, tags, ingredients
 *   tags and ingredients can be a csv, searched separately, rest are literal
 */
export const searchRecipes = async (req: OpenRequest, res: Response) => {
  const matchAll = req.query.all === 'true';

  const createWildcardFilter = (term: string) => ({
    $or: [
      { title: { $regex: term.trim(), $options: 'i' } },
      { 'ingredients.ingredient': { $regex: term.trim(), $options: 'i' } },
      { 'ingredients.note': { $regex: term.trim(), $options: 'i' } },
      { steps: { $regex: term.trim(), $options: 'i' } },
      { tags: { $regex: term.trim(), $options: 'i' } },
      { footnotes: { $regex: term.trim(), $options: 'i' } },
    ],
  });

  const createIngredientsFilter = (term: string) => ({
    $or: [
      { 'ingredients.ingredient': { $regex: term, $options: 'i' } },
      { 'ingredients.note': { $regex: term, $options: 'i' } },
    ],
  });

  // We will build up an array of filter parts, then combine them at the end with $and or $or depending on matchAll
  const filterParts: any[] = [];

  // Wildcard searches will search title, ingredients/notes, steps, tags and footnotes for the term
  // They can be sent as a comma-separated list. We need to construct an $or filter for each term in the csv
  if (req.query.wildcard) {
    const wildcardQuery = req.query.wildcard as string;
    filterParts.push(...wildcardQuery.split(',').map(createWildcardFilter));
  }

  // Tags can be sent as a comma-separated list. We want to matcn ANY or ALL of them depending on matchAll
  if (req.query.tags) {
    const tagsQuery = req.query.tags as string;
    if (tagsQuery.includes(',')) {
      const tagsFilter = tagsQuery.split(',').map((tag) => tag.toLowerCase().trim());
      if (matchAll) {
        filterParts.push({ $all: tagsFilter });
      } else {
        filterParts.push({ $in: tagsFilter });
      }
    } else {
      filterParts.push({ tags: tagsQuery.toLowerCase().trim() });
    }
  }

  // Ingredient queries search both the ingredient and note fields for a match
  // Ingredients can be sent as a comma-separated list. We want to find a match for ALL or ANY of them across any number of ingredients objects
  if (req.query.ingredients) {
    const ingredientsQuery = req.query.ingredients as string;
    filterParts.push(...ingredientsQuery.split(',').map(createIngredientsFilter));
  }

  if (req.query.title) {
    filterParts.push({ title: { $regex: (req.query.title as string).trim(), $options: 'i' } });
  }

  if (req.query.source) {
    filterParts.push({ source: { $regex: (req.query.source as string).trim(), $options: 'i' } });
  }

  if (req.query.submitted_by) {
    filterParts.push({ submitted_by: { $regex: (req.query.submitted_by as string).trim(), $options: 'i' } });
  }

  if (req.query.category) {
    filterParts.push({ category: req.query.category });
  }

  if (req.query.vegetarian !== undefined) {
    filterParts.push({ vegetarian: Boolean(req.query.vegetarian) });
  }

  if (req.query.featured !== undefined) {
    filterParts.push({ featured: Boolean(req.query.featured) });
  }

  if (req.query.steps) {
    filterParts.push({ steps: { $regex: (req.query.steps as string).trim(), $options: 'i' } });
  }

  if (req.query.footnotes) {
    filterParts.push({ footnotes: { $regex: (req.query.footnotes as string).trim(), $options: 'i' } });
  }

  if (!filterParts.length) {
    return res.status(400).json({
      error: {
        message:
          'At least one search parameter is required. Supported params: title, source, submitted_by, category, vegetarian, featured, steps, footnotes, tags, ingredients, wildcard',
      },
    });
  }

  let filter: any = {};

  if (filterParts.length === 1) {
    filter = filterParts[0];
  } else if (matchAll) {
    filter = { $and: filterParts };
  } else {
    filter = { $or: filterParts };
  }

  if (req.query.limit) {
    const limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: { message: "'limit' must be a positive integer" } });
    }

    const data = await Recipe.find(filter).sort({ title: 1 }).limit(limit).lean();
    return res.status(200).json({ data });
  }

  const data = await Recipe.find(filter).sort({ title: 1 }).lean();
  res.status(200).json({ data });
};

/**
 * Returns the values of the Category enum
 */
export const listCategories = async (req: OpenRequest, res: Response) => {
  const categories = Object.values(Category);
  return res.status(200).json({ categories });
};

/**
 * Returns the full list of tags used across all recipes, sorted alphabetically.
 */
export const listTags = async (req: OpenRequest, res: Response) => {
  const tags = await Recipe.distinct('tags').sort();
  return res.status(200).json({ tags });
};

/**
 * Returns the complete list of users who have submitted at least one recipe, sorted alphabetically.
 */
export const listSubmitters = async (req: OpenRequest, res: Response) => {
  const submitters = await Recipe.distinct('submitted_by').sort();
  return res.status(200).json({ submitters });
};
