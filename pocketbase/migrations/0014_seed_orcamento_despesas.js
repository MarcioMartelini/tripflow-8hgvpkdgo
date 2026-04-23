migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      return // User not found, skip seeding
    }

    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (_) {
      // Attempt to fallback to first trip by this user
      try {
        const trips = app.findRecordsByFilter('trips', `owner_id = '${user.id}'`, '', 1, 0)
        if (trips.length > 0) {
          trip = trips[0]
        } else {
          const tripsCol = app.findCollectionByNameOrId('trips')
          trip = new Record(tripsCol)
          trip.set('title', 'Rio de Janeiro 2026')
          trip.set('destination', 'Rio de Janeiro')
          trip.set('start_date', '2026-05-10 12:00:00.000Z')
          trip.set('end_date', '2026-05-20 12:00:00.000Z')
          trip.set('owner_id', user.id)
          trip.set('status', 'planned')
          app.save(trip)
        }
      } catch (e) {
        return // Could not find or create a valid trip, skip
      }
    }

    const orcamentoCol = app.findCollectionByNameOrId('orcamento_planejado')
    const orcamentos = [
      { categoria: 'hospedagem', valor_planejado: 4000.0, moeda: 'BRL' },
      { categoria: 'transporte', valor_planejado: 1200.0, moeda: 'BRL' },
      { categoria: 'alimentação', valor_planejado: 2000.0, moeda: 'BRL' },
    ]

    for (const item of orcamentos) {
      const existing = app.findRecordsByFilter(
        'orcamento_planejado',
        `viagem_id = '${trip.id}' && categoria = '${item.categoria}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const record = new Record(orcamentoCol)
        record.set('viagem_id', trip.id)
        record.set('categoria', item.categoria)
        record.set('valor_planejado', item.valor_planejado)
        record.set('moeda', item.moeda)
        app.save(record)
      }
    }

    const despesasCol = app.findCollectionByNameOrId('despesas')
    const despesas = [
      {
        descricao: 'Reserva Hotel Copacabana',
        categoria: 'hospedagem',
        valor: 3500.0,
        moeda: 'BRL',
        data_despesa: '2026-05-15 12:00:00.000Z',
      },
      {
        descricao: 'Jantar Moqueca',
        categoria: 'alimentação',
        valor: 150.0,
        moeda: 'BRL',
        data_despesa: '2026-05-16 12:00:00.000Z',
      },
    ]

    for (const item of despesas) {
      const existing = app.findRecordsByFilter(
        'despesas',
        `viagem_id = '${trip.id}' && descricao = '${item.descricao}'`,
        '',
        1,
        0,
      )
      if (existing.length === 0) {
        const record = new Record(despesasCol)
        record.set('viagem_id', trip.id)
        record.set('usuario_id', user.id)
        record.set('categoria', item.categoria)
        record.set('descricao', item.descricao)
        record.set('valor', item.valor)
        record.set('moeda', item.moeda)
        record.set('data_despesa', item.data_despesa)
        app.save(record)
      }
    }
  },
  (app) => {
    // Safe down migration: leave data intact to prevent accidental loss
  },
)
