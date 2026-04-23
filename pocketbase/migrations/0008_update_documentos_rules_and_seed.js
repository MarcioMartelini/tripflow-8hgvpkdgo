migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('documentos')
    collection.listRule = 'usuario_id = @request.auth.id'
    collection.viewRule = 'usuario_id = @request.auth.id'
    collection.updateRule = 'usuario_id = @request.auth.id'
    collection.deleteRule = 'usuario_id = @request.auth.id'
    app.save(collection)

    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (err) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      user = new Record(users)
      user.setEmail('marcio_martelini@hotmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Marcio Silva')
      app.save(user)
    }

    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (err) {
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

    const now = new Date()
    const greenDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const yellowDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
    const redDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

    const docsToSeed = [
      {
        tipo: 'passaporte',
        nome_arquivo: 'passaporte_marcio.pdf',
        data_expiracao: greenDate.toISOString().replace('T', ' '),
      },
      {
        tipo: 'visto',
        nome_arquivo: 'visto_marcio.pdf',
        data_expiracao: yellowDate.toISOString().replace('T', ' '),
      },
      {
        tipo: 'seguro',
        nome_arquivo: 'seguro_marcio.pdf',
        data_expiracao: redDate.toISOString().replace('T', ' '),
      },
    ]

    const docsCol = app.findCollectionByNameOrId('documentos')

    for (let i = 0; i < docsToSeed.length; i++) {
      const d = docsToSeed[i]
      try {
        app.findFirstRecordByData('documentos', 'nome_arquivo', d.nome_arquivo)
      } catch (err) {
        const doc = new Record(docsCol)
        doc.set('usuario_id', user.id)
        doc.set('viagem_id', trip.id)
        doc.set('tipo', d.tipo)
        doc.set('nome_arquivo', d.nome_arquivo)
        doc.set('data_expiracao', d.data_expiracao)
        app.save(doc)
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documentos')
    collection.listRule = "@request.auth.id != ''"
    collection.viewRule = "@request.auth.id != ''"
    collection.updateRule = "@request.auth.id != ''"
    collection.deleteRule = "@request.auth.id != ''"
    app.save(collection)

    const docsToSeedNames = ['passaporte_marcio.pdf', 'visto_marcio.pdf', 'seguro_marcio.pdf']
    for (let i = 0; i < docsToSeedNames.length; i++) {
      const name = docsToSeedNames[i]
      try {
        const doc = app.findFirstRecordByData('documentos', 'nome_arquivo', name)
        app.delete(doc)
      } catch (err) {}
    }
  },
)
