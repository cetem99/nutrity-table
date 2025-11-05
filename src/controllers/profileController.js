import User from "../models/User.js";
import bcrypt from "bcrypt";

// Note: routes using these controllers should be protected by auth middleware
// so `req.userId` is available. Prefer token-based identification over
// accepting `userId` from the client.

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ message: "Erro ao carregar perfil" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // pre('save') will hash

    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: "Senha atual incorreta" });

    // Let the model's pre('save') hash the new password
    user.password = newPassword;
    await user.save();

    return res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error('updatePassword error:', error);
    return res.status(500).json({ message: "Erro ao alterar senha" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    return res.json({ message: "Conta excluída permanentemente" });
  } catch (error) {
    console.error('deleteAccount error:', error);
    return res.status(500).json({ message: "Erro ao excluir conta" });
  }
};
