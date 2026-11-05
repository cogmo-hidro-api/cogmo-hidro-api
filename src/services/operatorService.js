const operatorRepository = require('../repositories/operatorRepository');

const operatorService = {
  getAll() {
    return operatorRepository.findAll();
  },

  getById(id) {
    const operator = operatorRepository.findById(id);
    if (!operator) {
      throw { status: 404, code: 'OPERATOR_NOT_FOUND', message: 'Operador não encontrado' };
    }
    return operator;
  },

  create(data) {
    const { name, email, phone, type } = data;
    const validTypes = ['tecnico', 'supervisor', 'pesquisador'];

    if (!name || !email || !type) {
      throw { status: 400, code: 'INVALID_INPUT', message: 'Nome, email e tipo são obrigatórios' };
    }

    if (!validTypes.includes(type)) {
      throw { status: 400, code: 'INVALID_TYPE', message: 'Tipo deve ser: tecnico, supervisor ou pesquisador' };
    }

    if (operatorRepository.findByEmail(email)) {
      throw { status: 409, code: 'EMAIL_IN_USE', message: 'E-mail já cadastrado para outro operador' };
    }

    return operatorRepository.create({ name, email, phone, type });
  },

  update(id, data) {
    this.getById(id); // Garante que o operador existe (se não existir, lança erro 404)
    return operatorRepository.update(id, data);
  },

  delete(id) {
    this.getById(id); // Garante que existe
    operatorRepository.delete(id);
  },

  // Regras N:N (Estação <-> Operador)
  getOperatorsByStation(stationId) {
    return operatorRepository.findOperatorsByStation(stationId);
  },

  linkStation(stationId, operatorId, role) {
    try {
      return operatorRepository.linkStation(stationId, operatorId, role);
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('PRIMARY KEY')) {
        throw { status: 409, code: 'LINK_ALREADY_EXISTS', message: 'Operador já vinculado a esta estação' };
      }
      throw err;
    }
  },

  unlinkStation(stationId, operatorId) {
    const result = operatorRepository.unlinkStation(stationId, operatorId);
    if (result.changes === 0) {
      throw { status: 404, code: 'LINK_NOT_FOUND', message: 'Vínculo entre estação e operador não encontrado' };
    }
  }
};

module.exports = operatorService;