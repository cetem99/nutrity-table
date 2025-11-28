import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'g' },
  nutrition: { type: mongoose.Schema.Types.Mixed }, // store raw nutrition object from TACO API
});

const nutritionTableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  base: { type: String, enum: ['taco', 'usda'], default: 'taco' },
  portionSize: { type: Number, default: 100 },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now },
});

const NutritionTable = mongoose.model('NutritionTable', nutritionTableSchema);
export default NutritionTable;
