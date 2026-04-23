migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      user = new Record(users)
      user.setEmail('marcio_martelini@hotmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Marcio Silva')
      app.save(user)
    }

    const trips = app.findCollectionByNameOrId('trips')
    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (_) {
      trip = new Record(trips)
      trip.set('title', 'Rio de Janeiro 2026')
      trip.set('destination', 'Rio de Janeiro, Brasil')
      trip.set('start_date', '2026-12-10 12:00:00.000Z')
      trip.set('end_date', '2026-12-20 12:00:00.000Z')
      trip.set('owner_id', user.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    const docs = app.findCollectionByNameOrId('documentos')

    const seedDoc = (tipo, nome, dataExp) => {
      try {
        app.findFirstRecordByData('documentos', 'nome_arquivo', nome)
      } catch (_) {
        const doc = new Record(docs)
        doc.set('usuario_id', user.id)
        doc.set('viagem_id', trip.id)
        doc.set('tipo', tipo)
        doc.set('nome_arquivo', nome)
        if (dataExp) doc.set('data_expiracao', dataExp)
        app.save(doc)
      }
    }

    seedDoc('passaporte', 'passaporte_marcio.pdf', '2028-12-15 12:00:00.000Z')
    seedDoc('visto', 'visto_marcio.pdf', '2026-05-15 12:00:00.000Z')
    seedDoc('seguro', 'seguro_marcio.pdf', '2026-01-22 12:00:00.000Z')
  },
  (app) => {
    try {
      const trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
      app.delete(trip)
    } catch (_) {}
  },
)
