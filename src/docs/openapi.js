// Especificação OpenAPI da API (servida pelo Swagger em /api/docs).
// Os helpers abaixo evitam repetir o mesmo bloco de resposta/erro em cada rota.

const NOTICE = 'Dados simulados para fins didáticos. Não descrevem rios reais.';
const TYPES = ['tecnico', 'supervisor', 'pesquisador'];
const METRICS = ['level', 'rain'];

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const resp = (description, schema, example) => {
  const r = { description };
  if (schema || example !== undefined) {
    const content = {};
    if (schema) content.schema = schema;
    if (example !== undefined) content.example = example;
    r.content = { 'application/json': content };
  }
  return r;
};

const err = (code, message, description) =>
  resp(description, ref('Error'), { simulated: true, notice: NOTICE, error: { code, message } });

// toda resposta ganha simulated + notice; listas vêm em data
const list = (item) => ({ allOf: [ref('Simulated'), { type: 'object', properties: { data: { type: 'array', items: item } } }] });
const obj = (schema) => ({ allOf: [ref('Simulated'), schema] });

const body = (schema, example) => ({ required: true, content: { 'application/json': { schema, example } } });

const param = (name, where, description, schema = { type: 'integer', minimum: 1 }, required = true) =>
  ({ name, in: where, required, description, schema });

const SEC = [{ bearerAuth: [] }];
const E401 = err('UNAUTHORIZED', 'Token de autenticação não fornecido', 'Sem token ou token inválido');
const E400ID = err('INVALID_ID', 'id deve ser um número inteiro positivo', 'Id inválido');
const E404ST = err('STATION_NOT_FOUND', 'Estação não encontrada', 'Estação não existe');
const E404OB = err('OBSERVATION_NOT_FOUND', 'Leitura não encontrada', 'Leitura não existe');
const E404OP = err('OPERATOR_NOT_FOUND', 'Operador não encontrado', 'Operador não existe');

const stationId = param('id', 'path', 'Id da estação');
const observationId = param('id', 'path', 'Id da leitura');
const operatorId = param('id', 'path', 'Id do operador');
const metricFilter = param('metric', 'query', 'Filtra por métrica', { type: 'string', enum: METRICS }, false);

const schemas = {
  Simulated: {
    type: 'object',
    description: 'Campos presentes em toda resposta da API (regra Cogmo).',
    properties: { simulated: { type: 'boolean', example: true }, notice: { type: 'string', example: NOTICE } },
  },
  Error: {
    type: 'object',
    properties: {
      simulated: { type: 'boolean' },
      notice: { type: 'string' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'INVALID_METRIC' },
          message: { type: 'string', example: 'metric deve ser level ou rain' },
        },
      },
    },
  },
  Station: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      code: { type: 'string', example: 'EST-001' },
      name: { type: 'string', example: 'Estação Ribeirão Fictício' },
      river: { type: 'string', example: 'Ribeirão Fictício' },
      municipality: { type: 'string', example: 'Cidade Fictícia' },
      state: { type: 'string', example: 'DF' },
      latitude: { type: 'number', nullable: true, example: -15.79 },
      longitude: { type: 'number', nullable: true, example: -47.88 },
    },
  },
  StationListItem: {
    allOf: [ref('Station'), {
      type: 'object',
      properties: {
        updated_at: { type: 'string', format: 'date-time', nullable: true, description: 'Horário da leitura mais recente da estação (null se não tiver leitura)', example: '2026-11-10T12:00:00Z' },
      },
    }],
  },
  StationInput: {
    type: 'object',
    required: ['code', 'name', 'river', 'municipality', 'state'],
    properties: {
      code: { type: 'string' }, name: { type: 'string' }, river: { type: 'string' },
      municipality: { type: 'string' }, state: { type: 'string', description: 'Sigla da UF com 2 letras (é convertida para maiúscula)', example: 'DF' },
      latitude: { type: 'number' }, longitude: { type: 'number' },
    },
  },
  LatestReading: {
    type: 'object',
    nullable: true,
    properties: {
      value: { type: 'number', example: 2.41 },
      unit: { type: 'string', example: 'm' },
      observed_at: { type: 'string', format: 'date-time', example: '2026-11-01T12:00:00Z' },
    },
  },
  SeriesPoint: {
    type: 'object',
    properties: {
      observed_at: { type: 'string', format: 'date-time', example: '2026-10-31T13:00:00Z' },
      value: { type: 'number', example: 2.41 },
    },
  },
  Series: {
    type: 'object',
    properties: {
      station_id: { type: 'integer', example: 1 },
      metric: { type: 'string', enum: METRICS },
      unit: { type: 'string', enum: ['m', 'mm/h'] },
      hours: { type: 'integer', example: 24 },
      from: { type: 'string', format: 'date-time', nullable: true, example: '2026-10-31T12:00:00Z' },
      to: { type: 'string', format: 'date-time', nullable: true, example: '2026-11-01T12:00:00Z' },
      count: { type: 'integer', example: 22 },
      points: { type: 'array', items: ref('SeriesPoint') },
    },
  },
  Observation: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      station_id: { type: 'integer', example: 1 },
      metric: { type: 'string', enum: METRICS },
      value: { type: 'number', example: 2.75 },
      unit: { type: 'string', enum: ['m', 'mm/h'], description: 'Definida pela métrica: level → m, rain → mm/h' },
      observed_at: { type: 'string', format: 'date-time', example: '2030-01-01T12:00:00Z' },
      responsible_id: { type: 'integer', nullable: true, example: 1 },
    },
  },
  ObservationInput: {
    type: 'object',
    required: ['metric', 'value', 'observed_at'],
    properties: {
      station_id: { type: 'integer', description: 'Obrigatório em POST /observations; vem da URL em /stations/{id}/observations' },
      metric: { type: 'string', enum: METRICS },
      value: { type: 'number', description: 'Chuva (rain) não pode ser negativa' },
      observed_at: { type: 'string', description: 'UTC ISO 8601 sem milissegundos', example: '2030-01-01T12:00:00Z' },
      responsible_id: { type: 'integer', nullable: true },
    },
  },
  ResponsiblePublic: {
    type: 'object',
    nullable: true,
    description: 'Só id, nome e tipo: rota pública não mostra contato.',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Ana Técnica' },
      type: { type: 'string', enum: TYPES },
    },
  },
  Operator: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Ana Técnica' },
      email: { type: 'string', example: 'ana@cogmo.test' },
      phone: { type: 'string', nullable: true, example: '61999990000' },
      type: { type: 'string', enum: TYPES },
    },
  },
  OperatorInput: {
    type: 'object',
    required: ['name', 'email', 'type'],
    properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, type: { type: 'string', enum: TYPES } },
  },
  StationOperator: {
    allOf: [ref('Operator'), {
      type: 'object',
      properties: {
        role: { type: 'string', nullable: true, example: 'técnico de campo' },
        linked_at: { type: 'string', format: 'date-time' },
      },
    }],
  },
};

const responsibleBody = obj({ type: 'object', properties: { observation_id: { type: 'integer' }, responsible: ref('ResponsiblePublic') } });

const observationErrors = {
  400: err('INVALID_OBSERVED_AT', 'observed_at deve estar em UTC no formato 2026-11-03T12:00:00Z',
    'Dado inválido: metric (INVALID_METRIC), value (INVALID_VALUE), observed_at (INVALID_OBSERVED_AT) ou id (INVALID_ID)'),
  401: E401,
  404: err('STATION_NOT_FOUND', 'Estação não encontrada', 'Estação ou operador responsável não existe (STATION_NOT_FOUND, OPERATOR_NOT_FOUND)'),
  409: err('OBSERVATION_EXISTS', 'Já existe leitura dessa métrica nesse horário para a estação', 'Leitura repetida (mesma estação, métrica e horário)'),
};

const paths = {
  '/health': {
    get: { tags: ['Status'], summary: 'Verifica se a API está no ar', responses: { 200: resp('API no ar', undefined, { ok: true }) } },
  },

  // ---------- Autenticação ----------
  '/auth/register': {
    post: {
      tags: ['Autenticação'],
      summary: 'Cria usuário (senha guardada com bcrypt)',
      requestBody: body(
        { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } } },
        { name: 'Demo', email: 'demo@cogmo.test', password: '123456' },
      ),
      responses: {
        201: resp('Usuário criado', undefined, { simulated: true, notice: NOTICE, id: 1, name: 'Demo', email: 'demo@cogmo.test' }),
        400: err('INVALID_INPUT', 'Preencha todos os campos obrigatórios', 'Campo faltando'),
        409: err('EMAIL_ALREADY_EXISTS', 'E-mail já cadastrado', 'E-mail repetido'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Autenticação'],
      summary: 'Login: devolve token JWT (validade 1 h)',
      requestBody: body(
        { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
        { email: 'demo@cogmo.test', password: '123456' },
      ),
      responses: {
        200: resp('Token gerado', undefined, { simulated: true, notice: NOTICE, token: 'eyJhbGciOi...' }),
        400: err('INVALID_INPUT', 'E-mail e senha são obrigatórios', 'Campo faltando'),
        401: err('INVALID_CREDENTIALS', 'Credenciais inválidas', 'E-mail ou senha errados'),
      },
    },
  },

  // ---------- Contrato Cogmo + Estações ----------
  '/stations': {
    get: {
      tags: ['Contrato Cogmo'],
      summary: 'Lista as estações (ordem alfabética pelo nome)',
      responses: { 200: resp('Lista de estações', list(ref('StationListItem'))) },
    },
    post: {
      tags: ['Estações'],
      summary: 'Cria estação',
      security: SEC,
      requestBody: body(ref('StationInput'), { code: 'EST-900', name: 'Estação Teste', river: 'Rio Fictício', municipality: 'Cidade Fictícia', state: 'DF', latitude: -15.79, longitude: -47.88 }),
      responses: {
        201: resp('Estação criada', obj(ref('Station'))),
        400: err('INVALID_INPUT', 'Campos obrigatórios ausentes ou vazios: code, name, river, municipality, state',
          'Campo faltando (INVALID_INPUT), UF diferente de 2 letras (INVALID_STATE) ou coordenada fora do limite (INVALID_COORDINATES)'),
        401: E401,
        409: err('STATION_CODE_EXISTS', 'Já existe estação com o código EST-900', 'code repetido'),
      },
    },
  },
  '/stations/{id}': {
    parameters: [stationId],
    get: { tags: ['Estações'], summary: 'Busca uma estação', responses: { 200: resp('Estação', obj(ref('Station'))), 400: E400ID, 404: E404ST } },
    put: {
      tags: ['Estações'],
      summary: 'Edita estação (parcial: o que não vier no corpo continua igual)',
      security: SEC,
      requestBody: body({ type: 'object', properties: schemas.StationInput.properties }, { name: 'Estação Teste (editada)' }),
      responses: {
        200: resp('Estação atualizada', obj(ref('Station'))),
        400: err('INVALID_INPUT', 'Envie ao menos um campo para editar', 'Corpo vazio, id inválido ou campo inválido (INVALID_INPUT, INVALID_ID, INVALID_STATE, INVALID_COORDINATES)'),
        401: E401,
        404: E404ST,
        409: err('STATION_CODE_EXISTS', 'Já existe estação com o código EST-001', 'code já usado por outra estação'),
      },
    },
    delete: {
      tags: ['Estações'],
      summary: 'Remove estação (leituras e vínculos vão junto: ON DELETE CASCADE)',
      security: SEC,
      responses: { 204: { description: 'Removida' }, 400: E400ID, 401: E401, 404: E404ST },
    },
  },
  '/stations/{id}/summary': {
    get: {
      tags: ['Contrato Cogmo'],
      summary: 'Estação + última leitura de nível (m) e de chuva (mm/h)',
      parameters: [stationId],
      responses: {
        200: resp('Resumo', obj({
          type: 'object',
          properties: {
            station: ref('Station'),
            latest: {
              type: 'object',
              description: 'Cada métrica tem o próprio horário. Sem leitura → null. '
                + 'Os campos planos (level_m, rain_mm_h...) seguem o contrato da Cogmo.',
              properties: {
                level: ref('LatestReading'),
                rain: ref('LatestReading'),
                level_observed_at: { type: 'string', format: 'date-time', nullable: true, example: '2026-11-10T12:00:00Z' },
                level_m: { type: 'number', nullable: true, example: 1.35 },
                rain_observed_at: { type: 'string', format: 'date-time', nullable: true, example: '2026-11-10T12:00:00Z' },
                rain_mm_h: { type: 'number', nullable: true, example: 0.2 },
              },
            },
          },
        })),
        400: E400ID,
        404: E404ST,
      },
    },
  },
  '/stations/{id}/series': {
    get: {
      tags: ['Contrato Cogmo'],
      summary: 'Série de nível ou chuva',
      description: 'A janela de `hours` termina na **última leitura da estação** (o seed usa datas fixas). '
        + 'Pontos em ordem crescente de horário, intervalo (from, to]. '
        + '**Lacunas não são preenchidas**: hora sem leitura não aparece.',
      parameters: [
        stationId,
        param('metric', 'query', 'level (m) ou rain (mm/h)', { type: 'string', enum: METRICS }),
        param('hours', 'query', 'Tamanho da janela, de 1 a 72', { type: 'integer', minimum: 1, maximum: 72, default: 24 }, false),
      ],
      responses: {
        200: resp('Série', obj(ref('Series'))),
        400: err('INVALID_HOURS', 'hours deve ser um número inteiro de 1 a 72',
          'metric faltando/inválida (MISSING_METRIC, INVALID_METRIC), hours fora de 1 a 72 (INVALID_HOURS) ou id inválido (INVALID_ID)'),
        404: E404ST,
      },
    },
  },
  '/stations/{id}/dashboard': {
    get: {
      tags: ['Relacionamentos'],
      summary: 'Rota composta: estação + leituras das últimas 24 h com responsável + operadores vinculados',
      description: 'Cruza as 3 entidades numa resposta só. A janela de 24 h termina na última leitura da estação '
        + '(mesma regra da série). Operadores e responsáveis aparecem só com id, nome, tipo (e função), sem contato.',
      parameters: [stationId],
      responses: {
        200: resp('Dashboard', obj({
          type: 'object',
          properties: {
            station: ref('Station'),
            window: {
              type: 'object',
              properties: {
                hours: { type: 'integer', example: 24 },
                from: { type: 'string', format: 'date-time', nullable: true, example: '2026-11-09T12:00:00Z' },
                to: { type: 'string', format: 'date-time', nullable: true, example: '2026-11-10T12:00:00Z' },
              },
            },
            latest: { type: 'object', properties: { level: ref('LatestReading'), rain: ref('LatestReading') } },
            observations: {
              type: 'array',
              items: { allOf: [ref('Observation'), { type: 'object', properties: { responsible: ref('ResponsiblePublic') } }] },
            },
            operators: {
              type: 'array',
              items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, type: { type: 'string' }, role: { type: 'string', nullable: true } } },
            },
          },
        })),
        400: E400ID,
        404: E404ST,
      },
    },
  },

  // ---------- Leituras ----------
  '/observations': {
    get: {
      tags: ['Leituras'],
      summary: 'Lista leituras (mais recentes primeiro)',
      parameters: [param('station_id', 'query', 'Filtra por estação', undefined, false), metricFilter],
      responses: {
        200: resp('Lista de leituras', list(ref('Observation'))),
        400: err('INVALID_ID', 'station_id deve ser um número inteiro positivo', 'Filtro inválido'),
      },
    },
    post: {
      tags: ['Leituras'],
      summary: 'Cria leitura (unit sai da metric)',
      security: SEC,
      requestBody: body(ref('ObservationInput'), { station_id: 1, metric: 'level', value: 2.75, observed_at: '2030-01-01T12:00:00Z', responsible_id: 1 }),
      responses: { 201: resp('Leitura criada', obj(ref('Observation'))), ...observationErrors },
    },
  },
  '/observations/{id}': {
    parameters: [observationId],
    get: { tags: ['Leituras'], summary: 'Busca uma leitura', responses: { 200: resp('Leitura', obj(ref('Observation'))), 400: E400ID, 404: E404OB } },
    put: {
      tags: ['Leituras'],
      summary: 'Edita leitura',
      security: SEC,
      requestBody: body(ref('ObservationInput'), { metric: 'level', value: 3.1, observed_at: '2030-01-01T12:00:00Z', responsible_id: 1 }),
      responses: { 200: resp('Leitura atualizada', obj(ref('Observation'))), ...observationErrors },
    },
    delete: {
      tags: ['Leituras'],
      summary: 'Remove leitura',
      security: SEC,
      responses: { 204: { description: 'Removida' }, 400: E400ID, 401: E401, 404: E404OB },
    },
  },
  '/stations/{id}/observations': {
    parameters: [stationId],
    get: {
      tags: ['Relacionamentos'],
      summary: '1:N — leituras de uma estação',
      parameters: [metricFilter],
      responses: { 200: resp('Leituras da estação', list(ref('Observation'))), 400: E400ID, 404: E404ST },
    },
    post: {
      tags: ['Relacionamentos'],
      summary: '1:N — cria leitura na estação da URL',
      security: SEC,
      requestBody: body(ref('ObservationInput'), { metric: 'rain', value: 4.2, observed_at: '2030-01-01T12:00:00Z' }),
      responses: { 201: resp('Leitura criada', obj(ref('Observation'))), ...observationErrors },
    },
  },
  '/observations/{id}/responsible': {
    parameters: [observationId],
    get: {
      tags: ['Relacionamentos'],
      summary: '1:N — operador responsável pela leitura (só id, nome e tipo)',
      responses: { 200: resp('Responsável (null se não tiver)', responsibleBody), 400: E400ID, 404: E404OB },
    },
    put: {
      tags: ['Relacionamentos'],
      summary: 'Troca o responsável (operator_id: null remove)',
      security: SEC,
      requestBody: body({ type: 'object', required: ['operator_id'], properties: { operator_id: { type: 'integer', nullable: true } } }, { operator_id: 2 }),
      responses: {
        200: resp('Responsável atualizado', responsibleBody),
        400: err('MISSING_OPERATOR_ID', 'Informe operator_id (ou null para remover o responsável)', 'operator_id faltando ou inválido'),
        401: E401,
        404: err('OPERATOR_NOT_FOUND', 'Operador responsável não encontrado', 'Leitura ou operador não existe'),
      },
    },
  },

  // ---------- Operadores (dado pessoal: tudo com token) ----------
  '/operators': {
    get: {
      tags: ['Operadores'],
      summary: 'Lista operadores (tem contato: exige token)',
      security: SEC,
      responses: { 200: resp('Lista', list(ref('Operator'))), 401: E401 },
    },
    post: {
      tags: ['Operadores'],
      summary: 'Cria operador',
      security: SEC,
      requestBody: body(ref('OperatorInput'), { name: 'Operador Teste', email: 'operador.teste@cogmo.test', phone: '61999990000', type: 'tecnico' }),
      responses: {
        201: resp('Operador criado', obj(ref('Operator'))),
        400: err('INVALID_TYPE', 'Tipo deve ser: tecnico, supervisor ou pesquisador', 'Campo faltando (INVALID_INPUT) ou tipo inválido (INVALID_TYPE)'),
        401: E401,
        409: err('EMAIL_IN_USE', 'E-mail já cadastrado para outro operador', 'E-mail repetido'),
      },
    },
  },
  '/operators/{id}': {
    parameters: [operatorId],
    get: {
      tags: ['Operadores'],
      summary: 'Busca operador',
      security: SEC,
      responses: { 200: resp('Operador', obj(ref('Operator'))), 400: E400ID, 401: E401, 404: E404OP },
    },
    put: {
      tags: ['Operadores'],
      summary: 'Edita operador',
      security: SEC,
      requestBody: body(ref('OperatorInput'), { name: 'Novo nome' }),
      responses: {
        200: resp('Operador atualizado', obj(ref('Operator'))),
        400: E400ID,
        401: E401,
        404: E404OP,
        409: err('EMAIL_IN_USE', 'E-mail já cadastrado para outro operador', 'E-mail repetido'),
      },
    },
    delete: {
      tags: ['Operadores'],
      summary: 'Remove operador (vínculos saem junto; leituras ficam sem responsável)',
      security: SEC,
      responses: { 204: { description: 'Removido' }, 400: E400ID, 401: E401, 404: E404OP },
    },
  },
  '/stations/{id}/operators': {
    parameters: [stationId],
    get: {
      tags: ['Relacionamentos'],
      summary: 'N:N — operadores vinculados à estação',
      security: SEC,
      responses: { 200: resp('Operadores da estação', list(ref('StationOperator'))), 401: E401 },
    },
    post: {
      tags: ['Relacionamentos'],
      summary: 'N:N — vincula operador à estação',
      security: SEC,
      requestBody: body(
        { type: 'object', required: ['operator_id'], properties: { operator_id: { type: 'integer' }, role: { type: 'string' } } },
        { operator_id: 1, role: 'técnico de campo' },
      ),
      responses: {
        201: resp('Vinculado', undefined, { simulated: true, notice: NOTICE, message: 'Operador vinculado com sucesso' }),
        401: E401,
        404: err('STATION_NOT_FOUND', 'Estação não encontrada', 'Estação ou operador não existe'),
        409: err('LINK_ALREADY_EXISTS', 'Operador já vinculado a esta estação', 'Vínculo repetido'),
      },
    },
  },
  '/stations/{id}/operators/{operatorId}': {
    delete: {
      tags: ['Relacionamentos'],
      summary: 'N:N — desvincula operador',
      security: SEC,
      parameters: [stationId, param('operatorId', 'path', 'Id do operador')],
      responses: {
        204: { description: 'Desvinculado' },
        401: E401,
        404: err('LINK_NOT_FOUND', 'Vínculo entre estação e operador não encontrado', 'Vínculo não existe'),
      },
    },
  },
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de Monitoramento Hidrológico – Cogmo',
    version: '1.0.0',
    description: '**Dados simulados para fins didáticos. Não descrevem rios reais e não servem para alertas.**\n\n'
      + 'Horários em UTC (ISO 8601), nível em metros (m), chuva em milímetros por hora (mm/h). '
      + 'Toda resposta traz `simulated` e `notice`. Erros sempre no formato `{ "error": { "code", "message" } }`.\n\n'
      + 'Para rotas com cadeado: faça login em `POST /auth/login`, copie o `token` e clique em **Authorize**.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Contrato Cogmo', description: 'As rotas exigidas pela Cogmo (a série vale para level e rain)' },
    { name: 'Autenticação' },
    { name: 'Estações' },
    { name: 'Leituras' },
    { name: 'Operadores' },
    { name: 'Relacionamentos', description: '1:N, N:N, responsável e rota composta' },
    { name: 'Status' },
  ],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas },
  paths,
};
