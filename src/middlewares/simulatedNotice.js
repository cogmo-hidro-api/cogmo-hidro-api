// Regra da Cogmo: toda resposta deixa claro que os dados são simulados.
// Este middleware "embrulha" o res.json e acrescenta os campos automaticamente,
// então ninguém precisa lembrar de colocar em cada rota.
//   data_mode: 'simulation' -> nome exato do contrato da Cogmo (docs/CONTRATO_API.md do desafio)
//   simulated + notice      -> formato que a nossa API já usava (mantido para não quebrar nada)
const NOTICE = 'Dados simulados para fins didáticos. Não descrevem rios reais.';
const DATA_MODE = 'simulation';

function simulatedNotice(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // lista vira { simulated, notice, data: [...] }
    if (Array.isArray(body)) {
      return originalJson({ data_mode: DATA_MODE, simulated: true, notice: NOTICE, data: body });
    }
    // objeto ganha os campos no começo
    if (body && typeof body === 'object') {
      return originalJson({ data_mode: DATA_MODE, simulated: true, notice: NOTICE, ...body });
    }
    return originalJson(body);
  };

  next();
}

module.exports = simulatedNotice;
