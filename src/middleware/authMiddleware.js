import jwt from 'jsonwebtoken';

/**
 * Middleware para proteger rotas.
 * Adiciona req.userId com o id do usuário do token.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (req.headers['x-access-token'] || null);

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('auth error:', error);
    return res.status(401).json({ message: 'Token inválido.' });
  }
};
