import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * Gera JWT para um usuário
 * @param {Object} user - documento do mongoose
 * @returns {String} token
 */
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = generateToken(user);
    return res.json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Erro ao efetuar login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    // authMiddleware já anexou req.userId
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (password) user.password = password; // será hashado pelo pre('save')

    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    console.error('deleteProfile error:', error);
    return res.status(500).json({ message: 'Erro ao deletar usuário.' });
  }
};
