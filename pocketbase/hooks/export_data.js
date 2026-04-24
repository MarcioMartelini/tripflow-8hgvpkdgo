routerAdd(
  'GET',
  '/backend/v1/users/export-data',
  (e) => {
    const user = e.auth
    if (!user) throw new UnauthorizedError('Authentication required')

    const userId = user.id
    const db = $app

    const exportData = {
      user: {
        name: user.getString('name'),
        email: user.getString('email'),
        moeda_padrao: user.getString('moeda_padrao'),
      },
      trips: [],
      travelers: [],
      itinerary: [],
      documents: [],
      tickets: [],
      reservations: [],
      budget_planned: [],
      expenses: [],
      interactions: {
        comments: [],
        alerts: [],
      },
      note: 'Documentos criptografados não foram inclusos. Para acessá-los, faça login no TripFlow',
    }

    const trips = db.findRecordsByFilter('trips', 'owner_id = {:userId}', '-created', 0, 0, {
      userId,
    })
    exportData.trips = trips.map((t) => ({
      id: t.id,
      title: t.getString('title'),
      destination: t.getString('destination'),
      start_date: t.getString('start_date').split(' ')[0],
      end_date: t.getString('end_date').split(' ')[0],
      budget_total: t.get('budget_total'),
    }))

    const travelers = db.findRecordsByFilter(
      'viajantes',
      'viagem_id.owner_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.travelers = travelers.map((t) => ({
      name: t.getString('nome'),
      email: t.getString('email'),
      document: t.getString('documento'),
    }))

    const itinerary = db.findRecordsByFilter(
      'itinerario',
      'viagem_id.owner_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.itinerary = itinerary.map((i) => ({
      date: i.getString('data').split(' ')[0],
      time: i.getString('hora_inicio'),
      activity: i.getString('atividade'),
      location: i.getString('local'),
      type: i.getString('tipo'),
    }))

    const docs = db.findRecordsByFilter('documentos', 'usuario_id = {:userId}', '-created', 0, 0, {
      userId,
    })
    exportData.documents = docs.map((d) => ({
      type: d.getString('tipo'),
      file_name: d.getString('nome_arquivo_original') || d.getString('nome_arquivo'),
      expiration_date: d.getString('data_expiracao').split(' ')[0],
      notes: d.getString('notas'),
    }))

    const tickets = db.findRecordsByFilter(
      'tickets',
      'viagem_id.owner_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.tickets = tickets.map((t) => ({
      type: t.getString('tipo'),
      origin: t.getString('origem'),
      destination: t.getString('destino'),
      date: t.getString('data_saida').split(' ')[0],
      price: t.get('preco'),
      status: t.getString('status'),
    }))

    const reservations = db.findRecordsByFilter(
      'reservas',
      'viagem_id.owner_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.reservations = reservations.map((r) => ({
      type: r.getString('tipo'),
      name: r.getString('nome'),
      date: r.getString('data_checkin').split(' ')[0],
      price: r.get('preco'),
      status: r.getString('status'),
    }))

    const budget = db.findRecordsByFilter(
      'orcamento_planejado',
      'viagem_id.owner_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.budget_planned = budget.map((b) => ({
      category: b.getString('categoria'),
      planned_value: b.get('valor_planejado'),
      currency: b.getString('moeda'),
    }))

    const expenses = db.findRecordsByFilter(
      'despesas',
      'usuario_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.expenses = expenses.map((e) => ({
      category: e.getString('categoria'),
      description: e.getString('descricao'),
      value: e.get('valor'),
      currency: e.getString('moeda'),
      date: e.getString('data_despesa').split(' ')[0],
    }))

    const comments = db.findRecordsByFilter(
      'comentarios',
      'usuario_id = {:userId}',
      '-created',
      0,
      0,
      { userId },
    )
    exportData.interactions.comments = comments.map((c) => ({
      text: c.getString('texto'),
      timestamp: c.getString('created'),
    }))

    const alerts = db.findRecordsByFilter('alertas', 'usuario_id = {:userId}', '-created', 0, 0, {
      userId,
    })
    exportData.interactions.alerts = alerts.map((a) => ({
      message: a.getString('mensagem'),
      date: a.getString('data_alerta').split(' ')[0],
    }))

    const logsCol = db.findCollectionByNameOrId('logs_auditoria')
    const logRecord = new Record(logsCol)
    logRecord.set('usuario_id', userId)
    logRecord.set('acao', 'portabilidade_dados')
    logRecord.set('email', user.getString('email'))
    db.save(logRecord)

    return e.json(200, exportData)
  },
  $apis.requireAuth(),
)
