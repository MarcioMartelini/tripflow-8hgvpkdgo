migrate(
  (app) => {
    const tripsCol = app.findCollectionByNameOrId('trips')

    // 1. TICKETS
    let ticketsCol
    if (app.hasTable('tickets')) {
      ticketsCol = app.findCollectionByNameOrId('tickets')
    } else {
      ticketsCol = new Collection({
        name: 'tickets',
        type: 'base',
        fields: [
          {
            name: 'viagem_id',
            type: 'relation',
            required: true,
            collectionId: tripsCol.id,
            maxSelect: 1,
          },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['voo', 'trem', 'onibus', 'outro'],
            maxSelect: 1,
          },
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
    }

    ticketsCol.listRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    ticketsCol.viewRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    ticketsCol.createRule = "@request.auth.id != ''"
    ticketsCol.updateRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    ticketsCol.deleteRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"

    if (ticketsCol.id) {
      const tipoF = ticketsCol.fields.getByName('tipo')
      if (tipoF) tipoF.required = true
    }

    app.save(ticketsCol)

    ticketsCol.addIndex('idx_tickets_viagem_id', false, 'viagem_id', '')
    ticketsCol.addIndex('idx_tickets_status', false, 'status', '')
    app.save(ticketsCol)

    // 2. RESERVAS
    let reservasCol
    if (app.hasTable('reservas')) {
      reservasCol = app.findCollectionByNameOrId('reservas')
    } else {
      reservasCol = new Collection({
        name: 'reservas',
        type: 'base',
        fields: [
          {
            name: 'viagem_id',
            type: 'relation',
            required: true,
            collectionId: tripsCol.id,
            maxSelect: 1,
          },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['hotel', 'restaurante', 'atividade', 'outro'],
            maxSelect: 1,
          },
          { name: 'nome', type: 'text', required: true },
          { name: 'local', type: 'text' },
          { name: 'data_checkin', type: 'date', required: true },
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
    }

    reservasCol.listRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    reservasCol.viewRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    reservasCol.createRule = "@request.auth.id != ''"
    reservasCol.updateRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"
    reservasCol.deleteRule = "@request.auth.id != '' && viagem_id.owner_id = @request.auth.id"

    if (reservasCol.id) {
      const tF = reservasCol.fields.getByName('tipo')
      if (tF) tF.required = true
      const nF = reservasCol.fields.getByName('nome')
      if (nF) nF.required = true
      const dF = reservasCol.fields.getByName('data_checkin')
      if (dF) dF.required = true
    }

    app.save(reservasCol)

    reservasCol.addIndex('idx_reservas_viagem_id', false, 'viagem_id', '')
    reservasCol.addIndex('idx_reservas_data_checkin', false, 'data_checkin', '')
    app.save(reservasCol)
  },
  (app) => {
    try {
      const t = app.findCollectionByNameOrId('tickets')
      t.removeIndex('idx_tickets_viagem_id')
      t.removeIndex('idx_tickets_status')
      t.listRule = "@request.auth.id != ''"
      t.viewRule = "@request.auth.id != ''"
      t.updateRule = "@request.auth.id != ''"
      t.deleteRule = "@request.auth.id != ''"
      app.save(t)
    } catch (_) {}

    try {
      const r = app.findCollectionByNameOrId('reservas')
      r.removeIndex('idx_reservas_viagem_id')
      r.removeIndex('idx_reservas_data_checkin')
      r.listRule = "@request.auth.id != ''"
      r.viewRule = "@request.auth.id != ''"
      r.updateRule = "@request.auth.id != ''"
      r.deleteRule = "@request.auth.id != ''"
      app.save(r)
    } catch (_) {}
  },
)
