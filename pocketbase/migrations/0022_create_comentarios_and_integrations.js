migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const trips = app.findCollectionByNameOrId('trips')
    const itinerario = app.findCollectionByNameOrId('itinerario')

    const comentarios = new Collection({
      name: 'comentarios',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'atividade_id',
          type: 'relation',
          required: true,
          collectionId: itinerario.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'texto', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_comentarios_usuario_id ON comentarios (usuario_id)',
        'CREATE INDEX idx_comentarios_viagem_id ON comentarios (viagem_id)',
        'CREATE INDEX idx_comentarios_atividade_id ON comentarios (atividade_id)',
      ],
    })
    app.save(comentarios)

    const sincronizacaoOffline = new Collection({
      name: 'sincronizacao_offline',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['atividade', 'despesa', 'comentario', 'outro'],
          maxSelect: 1,
        },
        {
          name: 'acao',
          type: 'select',
          required: true,
          values: ['criar', 'editar', 'deletar'],
          maxSelect: 1,
        },
        { name: 'dados', type: 'text' },
        { name: 'sincronizado', type: 'bool' },
        { name: 'sincronizado_em', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_sinc_offline_usuario_id ON sincronizacao_offline (usuario_id)'],
    })
    app.save(sincronizacaoOffline)

    const integracaoGoogleCalendar = new Collection({
      name: 'integracao_google_calendar',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'google_calendar_id', type: 'text' },
        { name: 'token_acesso', type: 'text' },
        { name: 'token_refresh', type: 'text' },
        { name: 'conectado', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_integracao_gc_usuario_id ON integracao_google_calendar (usuario_id)',
      ],
    })
    app.save(integracaoGoogleCalendar)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('integracao_google_calendar'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('sincronizacao_offline'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('comentarios'))
    } catch (_) {}
  },
)
