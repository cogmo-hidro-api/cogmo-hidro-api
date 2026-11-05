const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const authService = {
  async register({ name, email, password }) {
    if (!name || !email || !password) {
      throw { status: 400, code: 'INVALID_INPUT', message: 'Preencha todos os campos obrigatórios' };
    }

    const userExists = userRepository.findByEmail(email);
    if (userExists) {
      throw { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'E-mail já cadastrado' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    return userRepository.create({ name, email, password_hash });
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw { status: 400, code: 'INVALID_INPUT', message: 'E-mail e senha são obrigatórios' };
    }

    const user = userRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' };
    }

    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });

    return { token };
  }
};

module.exports = authService;