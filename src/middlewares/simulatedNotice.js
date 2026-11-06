// Regra da Cogmo: toda resposta deixa claro que os dados são simulados.
// Este middleware "embrulha" o res.json e acrescenta os dois campos automaticamente,
// então ninguém precisa lembrar de colocar em cada rota.
const NOTICE = 'Dados simulados para fins didáticos. Não descrevem rios reais.';

function simulatedNotice(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // lista vira { simulated, notice, data: [...] }
    if (Array.isArray(body)) {
      return originalJson({ simulated: true, notice: NOTICE, data: body });
    }
    // objeto ganha os dois campos no começo
    if (body && typeof body === 'object') {
      return originalJson({ simulated: true, notice: NOTICE, ...body });
    }
    return originalJson(body);
  };

  next();
}

module.exports = simulatedNotice;
