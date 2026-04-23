migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (err) {
      return // Skip if admin user doesn't exist
    }

    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (err) {
      const tripsCol = app.findCollectionByNameOrId('trips')
      trip = new Record(tripsCol)
      trip.set('title', 'Rio de Janeiro 2026')
      trip.set('destination', 'Rio de Janeiro, Brasil')
      trip.set('start_date', '2026-10-10 12:00:00.000Z')
      trip.set('end_date', '2026-10-20 12:00:00.000Z')
      trip.set('owner_id', user.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    const docsCol = app.findCollectionByNameOrId('documentos')
    const dummyPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

    // 1. Passaporte Marcio (Green, far future)
    try {
      app.findFirstRecordByData('documentos', 'nome_arquivo', 'passaporte_marcio.pdf')
    } catch (err) {
      const doc = new Record(docsCol)
      doc.set('usuario_id', user.id)
      doc.set('viagem_id', trip.id)
      doc.set('tipo', 'passaporte')
      doc.set('nome_arquivo', 'passaporte_marcio.pdf')
      doc.set('url_arquivo', dummyPdfUrl)
      const d = new Date()
      d.setFullYear(d.getFullYear() + 2)
      doc.set('data_expiracao', d.toISOString().replace('T', ' '))
      app.save(doc)
    }

    // 2. Visto Marcio (Yellow, within 30 days)
    try {
      app.findFirstRecordByData('documentos', 'nome_arquivo', 'visto_marcio.pdf')
    } catch (err) {
      const doc = new Record(docsCol)
      doc.set('usuario_id', user.id)
      doc.set('viagem_id', trip.id)
      doc.set('tipo', 'visto')
      doc.set('nome_arquivo', 'visto_marcio.pdf')
      doc.set('url_arquivo', dummyPdfUrl)
      const d = new Date()
      d.setDate(d.getDate() + 15)
      doc.set('data_expiracao', d.toISOString().replace('T', ' '))
      app.save(doc)
    }

    // 3. Seguro Viagem Marcio (Red, past date)
    try {
      app.findFirstRecordByData('documentos', 'nome_arquivo', 'seguro_viagem_marcio.pdf')
    } catch (err) {
      const doc = new Record(docsCol)
      doc.set('usuario_id', user.id)
      doc.set('viagem_id', trip.id)
      doc.set('tipo', 'seguro')
      doc.set('nome_arquivo', 'seguro_viagem_marcio.pdf')
      doc.set('url_arquivo', dummyPdfUrl)
      const d = new Date()
      d.setDate(d.getDate() - 10)
      doc.set('data_expiracao', d.toISOString().replace('T', ' '))
      app.save(doc)
    }
  },
  (app) => {
    // Revert seed data
    try {
      const doc1 = app.findFirstRecordByData('documentos', 'nome_arquivo', 'passaporte_marcio.pdf')
      app.delete(doc1)
    } catch (err) {}
    try {
      const doc2 = app.findFirstRecordByData('documentos', 'nome_arquivo', 'visto_marcio.pdf')
      app.delete(doc2)
    } catch (err) {}
    try {
      const doc3 = app.findFirstRecordByData(
        'documentos',
        'nome_arquivo',
        'seguro_viagem_marcio.pdf',
      )
      app.delete(doc3)
    } catch (err) {}
  },
)
