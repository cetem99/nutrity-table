import mongoose from "mongoose";

const nutritionTableSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    portion: {
      type: String,
      required: true,
    },

    energyKcal: Number,
    energyKj: Number,
    carbohydrates: Number,
    sugars: Number,
    addedSugars: Number,
    protein: Number,
    totalFat: Number,
    saturatedFat: Number,
    transFat: Number,
    fiber: Number,
    sodium: Number,

    // pode adicionar mais campos se precisar:
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Nome da coleção: nutrition_tables
const NutritionTable = mongoose.model(
  "NutritionTable",
  nutritionTableSchema,
  "nutrition_tables"
);

export default NutritionTable;
