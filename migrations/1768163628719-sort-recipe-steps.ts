// Import your schemas here
import type { AnyBulkWriteOperation, Connection } from 'mongoose';
import { IRecipe, RecipeSchema } from '../src/models/recipe';
import exportedSteps from '../data/initialExport/exportedSteps.json';

type StepData = { id: number; step: string; recipe_order: number; recipe_id: number };

const getSortedStepsByRecipeId = (exportedSteps: Array<StepData>) => {
  const completeStepsByRecipeId: { [key: number]: StepData[] } = {};
  exportedSteps.forEach((stepData) => {
    completeStepsByRecipeId[stepData.recipe_id] ??= [];
    completeStepsByRecipeId[stepData.recipe_id].push(stepData);
  });

  const sortedStepsByRecipeId: { [key: number]: string[] } = {};
  for (const recipeId in completeStepsByRecipeId) {
    sortedStepsByRecipeId[recipeId] = completeStepsByRecipeId[recipeId]
      .sort((a, b) => a.recipe_order - b.recipe_order)
      .map((step) => step.step);
  }
  return sortedStepsByRecipeId;
};

const haveStepsChanged = (currentSteps: string[], newSteps: string[]) => {
  if (currentSteps.length !== newSteps.length) {
    return true;
  }

  const stepSet = new Set(currentSteps);
  if (stepSet.size !== newSteps.length) {
    return true;
  }

  for (const step of newSteps) {
    if (!stepSet.has(step)) {
      return true;
    }
  }

  return false;
};

export async function up(connection: Connection): Promise<void> {
  const sortedStepsByRecipeId = getSortedStepsByRecipeId(exportedSteps);

  const Recipe = connection.model('Recipe', RecipeSchema);
  const allRecipesCursor = Recipe.find({}).lean();

  const bulkWriteOps: AnyBulkWriteOperation<IRecipe>[] = [];

  for await (const recipe of allRecipesCursor) {
    const sortedSteps = sortedStepsByRecipeId[recipe.id];
    if (!sortedSteps) {
      console.log(`No exported steps found for recipe ID ${recipe.id}`);
      continue;
    }

    if (haveStepsChanged(recipe.steps, sortedSteps)) {
      console.log(`Steps don't match for recipe ID ${recipe.id}, skipping...`);
      continue;
    }

    bulkWriteOps.push({
      updateOne: {
        filter: { _id: recipe._id },
        update: { $set: { steps: sortedSteps } },
      },
    });
  }

  if (bulkWriteOps.length > 0) {
    const result = await Recipe.bulkWrite(bulkWriteOps);
    console.log(`Updated steps for ${result.modifiedCount} recipes.`);
    console.log('Bulk write result:', result);
  }
}

export async function down(connection: Connection): Promise<void> {
  // Write migration here
}
