migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      return // user not found, skip seed
    }

    const trips = app.findCollectionByNameOrId('trips')
    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'title', 'Rio de Janeiro 2026')
    } catch (_) {
      trip = new Record(trips)
      trip.set('title', 'Rio de Janeiro 2026')
      trip.set('destination', 'Rio de Janeiro')
      trip.set('start_date', '2026-05-15 12:00:00.000Z')
      trip.set('end_date', '2026-05-20 12:00:00.000Z')
      trip.set('owner_id', user.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    const itinerario = app.findCollectionByNameOrId('itinerario')

    try {
      app.findFirstRecordByData('itinerario', 'atividade', 'Voo para Rio')
    } catch (_) {
      const ev1 = new Record(itinerario)
      ev1.set('viagem_id', trip.id)
      ev1.set('data', '2026-05-15 12:00:00.000Z')
      ev1.set('hora_inicio', '14:00')
      ev1.set('hora_fim', '16:00')
      ev1.set('atividade', 'Voo para Rio')
      ev1.set('local', 'Aeroporto Congonhas')
      ev1.set('tipo', 'voo')
      app.save(ev1)
    }

    try {
      app.findFirstRecordByData('itinerario', 'atividade', 'Check-in Hotel')
    } catch (_) {
      const ev2 = new Record(itinerario)
      ev2.set('viagem_id', trip.id)
      ev2.set('data', '2026-05-15 12:00:00.000Z')
      ev2.set('hora_inicio', '18:00')
      ev2.set('hora_fim', '22:00')
      ev2.set('atividade', 'Check-in Hotel')
      ev2.set('local', 'Hotel Copacabana')
      ev2.set('tipo', 'hotel')
      app.save(ev2)
    }

    try {
      app.findFirstRecordByData('itinerario', 'atividade', 'Visita Cristo Redentor')
    } catch (_) {
      const ev3 = new Record(itinerario)
      ev3.set('viagem_id', trip.id)
      ev3.set('data', '2026-05-16 12:00:00.000Z')
      ev3.set('hora_inicio', '09:00')
      ev3.set('hora_fim', '12:00')
      ev3.set('atividade', 'Visita Cristo Redentor')
      ev3.set('local', 'Cristo Redentor')
      ev3.set('tipo', 'atividade')
      app.save(ev3)
    }
  },
  (app) => {
    // down migration
  },
)
