import { model, Types, Schema } from 'mongoose';

export enum Category {
  appetizer = 'appetizer',
  entree = 'entree',
  side = 'side',
  dessert = 'dessert',
  breakfast = 'breakfast',
  beverage = 'beverage',
  sauce = 'sauce',
}

export interface IRecipe {
  _id: Types.ObjectId;
  id: number; // TODO: Decide what to do about this
  title: string;
  source: string;
  source_url: string | null;
  submitted_by: string;
  servings: string | number; // TODO: Currently strings, should be number?
  category: Category;
  vegetarian: boolean;
  created_at: Date;
  featured: boolean;
  tags: string[];
  footnotes: string[];
  ingredients: Array<{ ingredient: string; note: string | null }>;
  steps: string[];
}

const RecipeSchema = new Schema<IRecipe>({
  id: { type: Number, required: true, unique: true }, // TODO: Decide what to do about this
  title: { type: String, required: true },
  source: { type: String, required: true },
  source_url: { type: String, required: false },
  submitted_by: { type: String, required: true },
  servings: { type: Schema.Types.Mixed, required: true }, // TODO: Currently strings, should be number?
  category: {
    type: String,
    required: true,
    enum: Object.values(Category),
  },
  vegetarian: { type: Boolean, required: true, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  featured: { type: Boolean, required: true, default: false },
  tags: { type: [String], required: true, default: [] },
  footnotes: { type: [String], required: true, default: [] },
  ingredients: {
    type: [
      {
        ingredient: { type: String, required: true },
        note: { type: String, required: false },
      },
    ],
    required: true,
    default: [],
  },
  steps: { type: [String], required: true, default: [] },
});

export default model<IRecipe>('Recipe', RecipeSchema);
