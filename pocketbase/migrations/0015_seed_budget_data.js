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
      return // Trip not found, skip seeding
    }

    const plannedData = [
      { categoria: 'hospedagem', valor: 3500 },
      { categoria: 'transporte', valor: 1200 },
      { categoria: 'alimentação', valor: 1500 },
      { categoria: 'atividades', valor: 1000 },
      { categoria: 'compras', valor: 800 },
    ]

    const orcamentoCol = app.findCollectionByNameOrId('orcamento_planejado')

    for (const item of plannedData) {
      try {
        const existing = app.findFirstRecordByFilter(
          'orcamento_planejado',
          `viagem_id = '${trip.id}' && categoria = '${item.categoria}'`,
        )
        existing.set('valor_planejado', item.valor)
        app.save(existing)
      } catch (_) {
        const record = new Record(orcamentoCol)
        record.set('viagem_id', trip.id)
        record.set('categoria', item.categoria)
        record.set('valor_planejado', item.valor)
        record.set('moeda', 'BRL')
        app.save(record)
      }
    }

    const despesasData = [
      { data: '2026-05-15 12:00:00.000Z', cat: 'hospedagem', desc: 'Hotel Copacabana', val: 3500 },
      { data: '2026-05-16 12:00:00.000Z', cat: 'alimentação', desc: 'Almoço na praia', val: 85 },
      { data: '2026-05-16 12:00:00.000Z', cat: 'transporte', desc: 'Uber', val: 45 },
      { data: '2026-05-17 12:00:00.000Z', cat: 'compras', desc: 'Souvenirs', val: 200 },
    ]

    const despesasCol = app.findCollectionByNameOrId('despesas')

    for (const item of despesasData) {
      try {
        const existing = app.findFirstRecordByFilter(
          'despesas',
          `viagem_id = '${trip.id}' && descricao = '${item.desc}'`,
        )
        existing.set('valor', item.val)
        existing.set('categoria', item.cat)
        existing.set('data_despesa', item.data)
        app.save(existing)
      } catch (_) {
        const record = new Record(despesasCol)
        record.set('viagem_id', trip.id)
        record.set('usuario_id', user.id)
        record.set('categoria', item.cat)
        record.set('descricao', item.desc)
        record.set('valor', item.val)
        record.set('moeda', 'BRL')
        record.set('data_despesa', item.data)
        app.save(record)
      }
    }
  },
  (app) => {},
)
