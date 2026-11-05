const operatorRepository = require('../repositories/operatorRepository');
const AppError = require('../utils/AppError');
const operatorService = {
getAll() {
return operatorRepository.findAll();
},
getById(id) {
const operator = operatorRepository.findById(id);
if (!operator) {
throw new AppError(404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado');
}
return operator;
},
create(data) {
const { name, email, phone, type } = data;
const validTypes = ['tecnico', 'supervisor', 'pesquisador'];

JavaScript
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