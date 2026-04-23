migrate(
  (app) => {
    // Users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('moeda_padrao')) {
      users.fields.add(new TextField({ name: 'moeda_padrao' }))
    }
    app.save(users)

    // Trips
    const trips = app.findCollectionByNameOrId('trips')
    if (!trips.fields.getByName('nome')) trips.fields.add(new TextField({ name: 'nome' }))
    if (!trips.fields.getByName('destino')) trips.fields.add(new TextField({ name: 'destino' }))
    if (!trips.fields.getByName('data_inicio'))
      trips.fields.add(new DateField({ name: 'data_inicio' }))
    if (!trips.fields.getByName('data_fim')) trips.fields.add(new DateField({ name: 'data_fim' }))
    if (!trips.fields.getByName('orcamento_planejado'))
      trips.fields.add(new NumberField({ name: 'orcamento_planejado' }))
    if (!trips.fields.getByName('moeda')) trips.fields.add(new TextField({ name: 'moeda' }))
    if (!trips.fields.getByName('descricao')) trips.fields.add(new TextField({ name: 'descricao' }))
    app.save(trips)

    // Viajantes
    const viajantes = new Collection({
      name: 'viajantes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'documento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(viajantes)

    // Itinerario
    const itinerario = new Collection({
      name: 'itinerario',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'hora_inicio', type: 'text' },
        { name: 'hora_fim', type: 'text' },
        { name: 'atividade', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['voo', 'hotel', 'atividade', 'refeição', 'outro'],
          maxSelect: 1,
        },
        { name: 'local', type: 'text' },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(itinerario)

    // Documentos
    const documentos = new Collection({
      name: 'documentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['passaporte', 'visto', 'seguro', 'comprovante', 'outro'],
          maxSelect: 1,
        },
        { name: 'nome_arquivo', type: 'text', required: true },
        { name: 'url_arquivo', type: 'url' },
        { name: 'data_expiracao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documentos)

    // Tickets
    const tickets = new Collection({
      name: 'tickets',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        { name: 'tipo', type: 'select', values: ['voo', 'trem', 'onibus', 'outro'], maxSelect: 1 },
        { name: 'numero_confirmacao', type: 'text' },
        { name: 'origem', type: 'text' },
        { name: 'destino', type: 'text' },
        { name: 'data_saida', type: 'date' },
        { name: 'hora_saida', type: 'text' },
        { name: 'data_chegada', type: 'date' },
        { name: 'hora_chegada', type: 'text' },
        { name: 'companhia', type: 'text' },
        { name: 'preco', type: 'number' },
        { name: 'moeda', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['confirmado', 'pendente', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tickets)

    // Reservas
    const reservas = new Collection({
      name: 'reservas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['hotel', 'restaurante', 'atividade', 'outro'],
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'local', type: 'text' },
        { name: 'data_checkin', type: 'date' },
        { name: 'hora_checkin', type: 'text' },
        { name: 'data_checkout', type: 'date' },
        { name: 'hora_checkout', type: 'text' },
        { name: 'numero_confirmacao', type: 'text' },
        { name: 'preco', type: 'number' },
        { name: 'moeda', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['confirmado', 'pendente', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(reservas)

    // Despesas
    const despesas = new Collection({
      name: 'despesas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'categoria',
          type: 'select',
          values: ['hospedagem', 'transporte', 'alimentação', 'atividades', 'compras', 'outro'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'valor', type: 'number', required: true },
        { name: 'moeda', type: 'text' },
        { name: 'data_despesa', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(despesas)

    // Alertas
    const alertas = new Collection({
      name: 'alertas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'viagem_id',
          type: 'relation',
          required: false,
          collectionId: trips.id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['voo', 'hotel', 'atividade', 'documento', 'outro'],
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'data_alerta', type: 'date' },
        { name: 'lido', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(alertas)
  },
  (app) => {},
)
