migrate(
  (app) => {
    // Ensure the mock user exists
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
      user.set('name', 'Marcio Silva')
      app.save(user)
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      user = new Record(users)
      user.setEmail('marcio_martelini@hotmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Marcio Silva')
      app.save(user)
    }

    // Ensure the mock trip exists
    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (_) {
      const trips = app.findCollectionByNameOrId('trips')
      trip = new Record(trips)
      trip.set('title', 'Rio de Janeiro 2026')
      trip.set('destination', 'Rio de Janeiro')
      trip.set('start_date', '2026-10-10 12:00:00.000Z')
      trip.set('end_date', '2026-10-20 12:00:00.000Z')
      trip.set('owner_id', user.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    // Create relative dates to guarantee testing of Yellow and Red statuses
    const now = new Date()
    const todayPlus15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
    const todayMinus15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

    const formatDbDate = (d) => d.toISOString().replace('T', ' ').substring(0, 23) + 'Z'

    const docs = [
      {
        id: 'm0ckdoc11111111',
        tipo: 'passaporte',
        nome_arquivo: 'Passaporte Marcio',
        arquivo: 'passaporte_marcio.pdf',
        data_expiracao: '2028-12-15 12:00:00.000Z',
      },
      {
        id: 'm0ckdoc22222222',
        tipo: 'visto',
        nome_arquivo: 'Visto Marcio',
        arquivo: 'visto_marcio.pdf',
        data_expiracao: formatDbDate(todayPlus15),
      },
      {
        id: 'm0ckdoc33333333',
        tipo: 'seguro',
        nome_arquivo: 'Seguro Viagem',
        arquivo: 'seguro_marcio.pdf',
        data_expiracao: formatDbDate(todayMinus15),
      },
    ]

    docs.forEach((d) => {
      try {
        app.findRecordById('documentos', d.id)
      } catch (_) {
        // Use raw SQL insert to bypass the required physical file constraint since this is mock data
        app
          .db()
          .newQuery(`
        INSERT INTO documentos (id, usuario_id, viagem_id, tipo, nome_arquivo, arquivo, data_expiracao, created, updated)
        VALUES ({:id}, {:user}, {:trip}, {:tipo}, {:nome_arquivo}, {:arquivo}, {:data_expiracao}, datetime('now'), datetime('now'))
      `)
          .bind({
            id: d.id,
            user: user.id,
            trip: trip.id,
            tipo: d.tipo,
            nome_arquivo: d.nome_arquivo,
            arquivo: d.arquivo,
            data_expiracao: d.data_expiracao,
          })
          .execute()
      }
    })
  },
  (app) => {
    const docs = ['m0ckdoc11111111', 'm0ckdoc22222222', 'm0ckdoc33333333']
    docs.forEach((id) => {
      try {
        app.db().newQuery('DELETE FROM documentos WHERE id = {:id}').bind({ id }).execute()
      } catch (_) {}
    })
  },
)
