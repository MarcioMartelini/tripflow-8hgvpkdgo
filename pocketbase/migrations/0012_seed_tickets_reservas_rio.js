migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')
    const tickets = app.findCollectionByNameOrId('tickets')
    const reservas = app.findCollectionByNameOrId('reservas')

    let admin
    try {
      admin = app.findAuthRecordByEmail('users', 'marcio_martelini@hotmail.com')
    } catch (_) {
      return // No admin, skip
    }

    // Check if trip exists
    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (_) {
      trip = new Record(trips)
      trip.set('title', 'Rio de Janeiro 2026')
      trip.set('destination', 'Rio de Janeiro, Brasil')
      trip.set('start_date', '2026-05-15 12:00:00.000Z')
      trip.set('end_date', '2026-05-22 12:00:00.000Z')
      trip.set('owner_id', admin.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    // Tickets
    try {
      app.findFirstRecordByData('tickets', 'numero_confirmacao', 'LA1234')
    } catch (_) {
      const t1 = new Record(tickets)
      t1.set('viagem_id', trip.id)
      t1.set('tipo', 'voo')
      t1.set('numero_confirmacao', 'LA1234')
      t1.set('origem', 'Congonhas')
      t1.set('destino', 'Galeão')
      t1.set('data_saida', '2026-05-15 12:00:00.000Z')
      t1.set('hora_saida', '14:00')
      t1.set('data_chegada', '2026-05-15 12:00:00.000Z')
      t1.set('hora_chegada', '16:00')
      t1.set('companhia', 'LATAM')
      t1.set('preco', 450)
      t1.set('moeda', 'BRL')
      t1.set('status', 'confirmado')
      app.save(t1)
    }

    try {
      app.findFirstRecordByData('tickets', 'numero_confirmacao', 'LA5678')
    } catch (_) {
      const t2 = new Record(tickets)
      t2.set('viagem_id', trip.id)
      t2.set('tipo', 'voo')
      t2.set('numero_confirmacao', 'LA5678')
      t2.set('origem', 'Galeão')
      t2.set('destino', 'Congonhas')
      t2.set('data_saida', '2026-05-22 12:00:00.000Z')
      t2.set('hora_saida', '16:00')
      t2.set('data_chegada', '2026-05-22 12:00:00.000Z')
      t2.set('hora_chegada', '18:00')
      t2.set('companhia', 'LATAM')
      t2.set('preco', 450)
      t2.set('moeda', 'BRL')
      t2.set('status', 'confirmado')
      app.save(t2)
    }

    // Reservas
    try {
      app.findFirstRecordByData('reservas', 'nome', 'Hotel Copacabana')
    } catch (_) {
      const r1 = new Record(reservas)
      r1.set('viagem_id', trip.id)
      r1.set('tipo', 'hotel')
      r1.set('nome', 'Hotel Copacabana')
      r1.set('local', 'Rio de Janeiro')
      r1.set('data_checkin', '2026-05-15 12:00:00.000Z')
      r1.set('data_checkout', '2026-05-22 12:00:00.000Z')
      r1.set('preco', 3500)
      r1.set('moeda', 'BRL')
      r1.set('status', 'confirmado')
      app.save(r1)
    }

    try {
      app.findFirstRecordByData('reservas', 'nome', 'Restaurante Moqueca')
    } catch (_) {
      const r2 = new Record(reservas)
      r2.set('viagem_id', trip.id)
      r2.set('tipo', 'restaurante')
      r2.set('nome', 'Restaurante Moqueca')
      r2.set('local', 'Rio de Janeiro')
      r2.set('data_checkin', '2026-05-16 12:00:00.000Z')
      r2.set('preco', 150)
      r2.set('moeda', 'BRL')
      r2.set('status', 'confirmado')
      app.save(r2)
    }
  },
  (app) => {
    // Revert
    try {
      const t1 = app.findFirstRecordByData('tickets', 'numero_confirmacao', 'LA1234')
      app.delete(t1)
    } catch (_) {}
    try {
      const t2 = app.findFirstRecordByData('tickets', 'numero_confirmacao', 'LA5678')
      app.delete(t2)
    } catch (_) {}
    try {
      const r1 = app.findFirstRecordByData('reservas', 'nome', 'Hotel Copacabana')
      app.delete(r1)
    } catch (_) {}
    try {
      const r2 = app.findFirstRecordByData('reservas', 'nome', 'Restaurante Moqueca')
      app.delete(r2)
    } catch (_) {}
    try {
      const trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
      app.delete(trip)
    } catch (_) {}
  },
)
