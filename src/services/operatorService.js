const operatorRepository = require('../repositories/operatorRepository');
const AppError = require('../utils/AppError');
const { parseId } = require('../utils/validators');

const VALID_TYPES = ['tecnico', 'supervisor', 'pesquisador'];

const operatorService = {
  getAll() {
    return operatorRepository.findAll();
  },

  getById(rawId) {
    const id = parseId(rawId); // id que não é número → 400 INVALID_ID
    const operator = operatorRepository.findById(id);
    if (!operator) {
      throw new AppError(404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado');
    }
    return operator;
  },

  create(data = {}) {
    const { name, email, phone, type } = data;

    if (!name || !email || !type) {
      throw new AppError(400, 'INVALID_INPUT', 'Nome, email e tipo são obrigatórios');
    }
    if (!VALID_TYPES.includes(type)) {
      throw new AppError(400, 'INVALID_TYPE', 'Tipo deve ser: tecnico, supervisor ou pesquisador');
    }
    if (operatorRepository.findByEmail(email)) {
      throw new AppError(409, 'EMAIL_IN_USE', 'E-mail já cadastrado para outro operador');
    }

    return operatorRepository.create({ name, email, phone, type });
  },

  update(rawId, data = {}) {
    const current = this.getById(rawId); // 404 se não existir

    // junta o que já existe com o que veio no body (dá pra mandar só 1 campo)
    const merged = { ...current, ...data };

    if (!merged.name || !merged.email) {
      throw new AppError(400, 'INVALID_INPUT', 'Nome e email não podem ficar vazios');
    }
    if (!VALID_TYPES.includes(merged.type)) {
      throw new AppError(400, 'INVALID_TYPE', 'Tipo deve ser: tecnico, supervisor ou pesquisador');
    }
    const other = operatorRepository.findByEmail(merged.email);
    if (other && other.id !== current.id) {
      throw new AppError(409, 'EMAIL_IN_USE', 'E-mail já cadastrado para outro operador');
    }

    return operatorRepository.update(current.id, merged);
  },

  delete(rawId) {
    const current = this.getById(rawId); // 404 se não existir
    operatorRepository.delete(current.id);
  },

  // Regras N:N (Estação <-> Operador)
  getOperatorsByStation(rawStationId) {
    const stationId = parseId(rawStationId, 'id da estação');
    if (!operatorRepository.stationExists(stationId)) {
      throw new AppError(404, 'STATION_NOT_FOUND', 'Estação não encontrada');
    }
    return operatorRepository.findOperatorsByStation(stationId);
  },

  linkStation(rawStationId, rawOperatorId, role) {
    const stationId = parseId(rawStationId, 'id da estação');
    const operatorId = parseId(rawOperatorId, 'operator_id');

    if (!operatorRepository.stationExists(stationId)) {
      throw new AppError(404, 'STATION_NOT_FOUND', 'Estação não encontrada');
    }
    this.getById(operatorId); // 404 se o operador não existir

    try {
      return operatorRepository.linkStation(stationId, operatorId, role);
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('PRIMARY KEY')) {
        throw new AppError(409, 'LINK_ALREADY_EXISTS', 'Operador já vinculado a esta estação');
      }
      throw err;
    }
  },

  unlinkStation(rawStationId, rawOperatorId) {
    const stationId = parseId(rawStationId, 'id da estação');
    const operatorId = parseId(rawOperatorId, 'id do operador');
    const result = operatorRepository.unlinkStation(stationId, operatorId);
    if (result.changes === 0) {
      throw new AppError(404, 'LINK_NOT_FOUND', 'Vínculo entre estação e operador não encontrado');
    }
  },
};

module.exports = operatorService;
