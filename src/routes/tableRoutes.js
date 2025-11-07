import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createTable, listTables, getTable, searchFoods, getFood, deleteTable, updateTable } from '../controllers/tableController.js';

const router = express.Router();

router.post('/', protect, createTable);
router.get('/', protect, listTables);
// public search endpoint to autocomplete ingredient names from DB
// public endpoints: food info and search for autocomplete
router.get('/food', getFood);
router.get('/search-food', searchFoods);

// allow deletion of a table by id (protected)
router.delete('/:id', protect, deleteTable);

// update table (e.g. portion size)
router.put('/:id', protect, updateTable);

// keep parameterized routes after specific routes
router.get('/:id', protect, getTable);

export default router;
