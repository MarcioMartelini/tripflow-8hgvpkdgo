migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const r = new Record(users)
        r.setEmail(email)
        r.setPassword('Skip@Pass')
        r.setVerified(true)
        r.set('name', name)
        app.save(r)
        return r
      }
    }

    const marcio = seedUser('marcio@email.com', 'Marcio Silva')
    const ana = seedUser('ana@email.com', 'Ana Costa')
    const carlos = seedUser('carlos@email.com', 'Carlos Oliveira')
    const admin = seedUser('marcio_martelini@hotmail.com', 'Admin')

    const trips = app.findCollectionByNameOrId('trips')
    const seedTrip = (title, start, end, budget, ownerId) => {
      try {
        return app.findFirstRecordByData('trips', 'nome', title)
      } catch (_) {
        const r = new Record(trips)
        r.set('nome', title)
        r.set('title', title)
        r.set('destino', title.split(' ')[0])
        r.set('destination', title.split(' ')[0])
        r.set('data_inicio', start)
        r.set('start_date', start)
        r.set('data_fim', end)
        r.set('end_date', end)
        r.set('orcamento_planejado', budget)
        r.set('budget_total', budget)
        r.set('moeda', 'BRL')
        r.set('owner_id', ownerId)
        r.set('status', 'planned')
        app.save(r)
        return r
      }
    }

    const trip1 = seedTrip(
      'Rio de Janeiro 2026',
      '2026-05-15 12:00:00.000Z',
      '2026-05-22 12:00:00.000Z',
      8500,
      admin.id,
    )
    const trip2 = seedTrip(
      'São Paulo Business',
      '2026-06-10 12:00:00.000Z',
      '2026-06-12 12:00:00.000Z',
      3200,
      admin.id,
    )
    const trip3 = seedTrip(
      'Bahia Férias',
      '2026-07-01 12:00:00.000Z',
      '2026-07-15 12:00:00.000Z',
      12000,
      admin.id,
    )

    const itinerario = app.findCollectionByNameOrId('itinerario')
    const seedItin = (trip, date, hi, ativ, tipo, loc) => {
      try {
        return app.findFirstRecordByData('itinerario', 'atividade', ativ)
      } catch (_) {
        const r = new Record(itinerario)
        r.set('viagem_id', trip.id)
        r.set('data', date)
        r.set('hora_inicio', hi)
        r.set('atividade', ativ)
        r.set('tipo', tipo)
        r.set('local', loc)
        app.save(r)
        return r
      }
    }

    seedItin(trip1, '2026-05-15 12:00:00.000Z', '14:00', 'Voo para Rio', 'voo', 'Congonhas')
    seedItin(
      trip1,
      '2026-05-15 12:00:00.000Z',
      '18:00',
      'Check-in Hotel',
      'hotel',
      'Hotel Copacabana',
    )
    seedItin(
      trip1,
      '2026-05-16 12:00:00.000Z',
      '09:00',
      'Visita Cristo Redentor',
      'atividade',
      'Cristo Redentor',
    )

    const documentos = app.findCollectionByNameOrId('documentos')
    try {
      app.findFirstRecordByData('documentos', 'nome_arquivo', 'Passaporte Marcio')
    } catch (_) {
      const r = new Record(documentos)
      r.set('usuario_id', admin.id)
      r.set('viagem_id', trip1.id)
      r.set('tipo', 'passaporte')
      r.set('nome_arquivo', 'Passaporte Marcio')
      r.set('data_expiracao', '2028-12-15 12:00:00.000Z')
      app.save(r)
    }

    const despesas = app.findCollectionByNameOrId('despesas')
    try {
      app.findFirstRecordByData('despesas', 'descricao', 'Almoço na praia')
    } catch (_) {
      const r = new Record(despesas)
      r.set('viagem_id', trip1.id)
      r.set('usuario_id', admin.id)
      r.set('categoria', 'alimentação')
      r.set('descricao', 'Almoço na praia')
      r.set('valor', 85)
      r.set('moeda', 'BRL')
      r.set('data_despesa', '2026-05-16 12:00:00.000Z')
      app.save(r)
    }
  },
  (app) => {},
)
