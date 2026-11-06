const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const authService = {
async register({ name, email, password }) {
if (!name || !email || !password) {
throw new AppError(400, 'INVALID_INPUT', 'Preencha todos os campos obrigatórios');
}

const userExists = userRepository.findByEmail(email);
if (userExists) {
  throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'E-mail já cadastrado');
}

const password_hash = await bcrypt.hash(password, 10);
return userRepository.create({ name, email, password_hash });
 },
 async login({ email, password }) {
if (!email || !password) {
throw new AppError(400, 'INVALID_INPUT', 'E-mail e senha são obrigatórios');
}

const user = userRepository.findByEmail(email);
if (!user) {
  throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas');
}

const isMatch = await bcrypt.compare(password, user.password_hash);
if (!isMatch) {
  throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas');
}

const secret = process.env.JWT_SECRET;
const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });

return { token };
 }
};
module.exports = authService;