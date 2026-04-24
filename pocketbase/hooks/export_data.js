routerAdd(
  'GET',
  '/backend/v1/users/export-data',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const userId = user.id

    // Audit log
    const audit = new Record($app.findCollectionByNameOrId('logs_auditoria'))
    audit.set('usuario_id', userId)
    audit.set('acao', 'portabilidade_dados')
    audit.set('email', user.getString('email'))
    $app.saveNoValidate(audit)

    const safeDate = (d) => (d ? d.split(' ')[0] : '')
    const safeNumber = (n) => Number(Number(n || 0).toFixed(2))

    // Fetch data
    const data = {
      usuario: {
        id: user.id,
        nome: user.getString('name'),
        email: user.getString('email'),
        moeda_padrao: user.getString('moeda_padrao') || 'BRL',
      },
      viagens: [],
      viajantes: [],
      itinerario: [],
      documentos: [],
      tickets: [],
      reservas: [],
      orcamento: [],
      despesas: [],
      comentarios: [],
      alertas: [],
      aviso:
        'Documentos criptografados não foram inclusos. Para acessá-los, faça login no TripFlow',
      nota_seguranca:
        'Documentos criptografados não foram inclusos. Para acessá-los, faça login no TripFlow',
    }

    // Trips
    const trips = $app.findRecordsByFilter('trips', `owner_id = '${userId}'`, '-created', 1000, 0)
    const tripIds = trips.map((t) => t.id)

    trips.forEach((t) => {
      data.viagens.push({
        id: t.id,
        nome: t.getString('title'),
        datas: `${safeDate(t.getString('start_date'))} a ${safeDate(t.getString('end_date'))}`,
        destino: t.getString('destination'),
        orcamento_total: safeNumber(t.get('budget_total')),
      })
    })

    if (tripIds.length > 0) {
      const tripFilter = tripIds.map((id) => `viagem_id = '${id}'`).join(' || ')

      // Travelers
      const travelers = $app.findRecordsByFilter('viajantes', tripFilter, '', 1000, 0)
      travelers.forEach((t) => {
        data.viajantes.push({
          nome: t.getString('nome'),
          email: t.getString('email'),
          documento: t.getString('documento'),
        })
      })

      // Itinerary
      const itinerary = $app.findRecordsByFilter('itinerario', tripFilter, 'data', 1000, 0)
      itinerary.forEach((i) => {
        data.itinerario.push({
          data: safeDate(i.getString('data')),
          hora_inicio: i.getString('hora_inicio'),
          atividade: i.getString('atividade'),
          local: i.getString('local'),
          tipo: i.getString('tipo'),
        })
      })

      // Tickets
      const tickets = $app.findRecordsByFilter('tickets', tripFilter, 'data_saida', 1000, 0)
      tickets.forEach((t) => {
        data.tickets.push({
          tipo: t.getString('tipo'),
          origem: t.getString('origem'),
          destino: t.getString('destino'),
          data_saida: safeDate(t.getString('data_saida')),
          data_chegada: safeDate(t.getString('data_chegada')),
          preco: safeNumber(t.get('preco')),
          moeda: t.getString('moeda'),
        })
      })

      // Reservations
      const reservations = $app.findRecordsByFilter('reservas', tripFilter, 'data_checkin', 1000, 0)
      reservations.forEach((r) => {
        data.reservas.push({
          tipo: r.getString('tipo'),
          nome: r.getString('nome'),
          local: r.getString('local'),
          data_checkin: safeDate(r.getString('data_checkin')),
          data_checkout: safeDate(r.getString('data_checkout')),
          preco: safeNumber(r.get('preco')),
          moeda: r.getString('moeda'),
        })
      })

      // Budget
      const budget = $app.findRecordsByFilter('orcamento_planejado', tripFilter, '', 1000, 0)
      budget.forEach((b) => {
        data.orcamento.push({
          categoria: b.getString('categoria'),
          valor_planejado: safeNumber(b.get('valor_planejado')),
          moeda: b.getString('moeda'),
        })
      })
    }

    // Documents (metadata)
    const docsFilter = `usuario_id = '${userId}'`
    const documents = $app.findRecordsByFilter('documentos', docsFilter, '', 1000, 0)
    documents.forEach((d) => {
      data.documentos.push({
        tipo: d.getString('tipo'),
        nome: d.getString('nome_arquivo_original') || d.getString('nome_arquivo'),
        data_expiracao: safeDate(d.getString('data_expiracao')),
        notas: d.getString('notas'),
      })
    })

    // Expenses
    const expensesFilter = `usuario_id = '${userId}'`
    const expenses = $app.findRecordsByFilter('despesas', expensesFilter, 'data_despesa', 1000, 0)
    expenses.forEach((e) => {
      data.despesas.push({
        categoria: e.getString('categoria'),
        valor: safeNumber(e.get('valor')),
        data_despesa: safeDate(e.getString('data_despesa')),
        descricao: e.getString('descricao'),
        moeda: e.getString('moeda'),
      })
    })

    // Comments
    const commentsFilter = `usuario_id = '${userId}'`
    const comments = $app.findRecordsByFilter('comentarios', commentsFilter, '-created', 1000, 0)
    comments.forEach((c) => {
      data.comentarios.push({
        texto: c.getString('texto'),
        created: c.getString('created'),
      })
    })

    // Alerts
    const alertsFilter = `usuario_id = '${userId}'`
    const alerts = $app.findRecordsByFilter('alertas', alertsFilter, '-data_alerta', 1000, 0)
    alerts.forEach((a) => {
      data.alertas.push({
        tipo: a.getString('tipo'),
        mensagem: a.getString('mensagem'),
        data_alerta: safeDate(a.getString('data_alerta')),
      })
    })

    return e.json(200, data)
  },
  $apis.requireAuth(),
)
