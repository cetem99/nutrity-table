import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from "./routes/profileRoutes.js";
import tableRoutes from './routes/tableRoutes.js';


// Config
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public (serve seus HTML/CSS/JS/imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Conectar no MongoDB
connectDB();

// API routes
app.use('/api/users', userRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/tables', tableRoutes);

// Fallback: serve login.html para root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
