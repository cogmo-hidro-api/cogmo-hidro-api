const operatorRepository = require('../repositories/operatorRepository');
const { parseId } = require('../utils/validators');
const VALID_TYPES = ['tecnico', 'supervisor', 'pesquisador'];
const AppError = require('../utils/AppError');
const operatorService = {
getAll() {
return operatorRepository.findAll();
},
getById(rawId) {
const id = parseId(rawId);
if (!operator) {
throw new AppError(404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado');
}
return operator;
},
create(data) {
const { name, email, phone, type } = data;
const validTypes = ['tecnico', 'supervisor', 'pesquisador'];

if (!name || !email || !type) {
  throw new AppError(400, 'INVALID_INPUT', 'Nome, email e tipo são obrigatórios');
}
if (!validTypes.includes(type)) {
  throw new AppError(400, 'INVALID_TYPE', 'Tipo deve ser: tecnico, supervisor ou pesquisador');
}

if (operatorRepository.findByEmail(email)) {
  throw new AppError(409, 'EMAIL_IN_USE', 'E-mail já cadastrado para outro operador');
}

return operatorRepository.create({ name, email, phone, type });
 },
update(rawId, data) {
const current = this.getById(rawId); // 404 se não existir
// junta o que já existe com o que veio no body (dá pra mandar só 1 campo)
const merged = { ...current, ...data };
if (!VALID_TYPES.includes(merged.type)) {
  throw new AppError(400, 'INVALID_TYPE', 'Tipo deve ser: tecnico, supervisor ou pesquisador');
}
const other = operatorRepository.findByEmail(merged.email);
if (other && other.id !== current.id) {
  throw new AppError(409, 'EMAIL_IN_USE', 'E-mail já cadastrado para outro operador');
}
return operatorRepository.update(current.id, merged);
},
// Regras N:N (Estação <-> Operador)
getOperatorsByStation(stationId) {
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
unlinkStation(stationId, operatorId) {
const result = operatorRepository.unlinkStation(stationId, operatorId);
if (result.changes === 0) {
throw new AppError(404, 'LINK_NOT_FOUND', 'Vínculo entre estação e operador não encontrado');
}
}
};
module.exports = operatorService;