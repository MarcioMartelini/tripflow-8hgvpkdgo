migrate(
  (app) => {
    // 1. Ensure User
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      user = new Record(usersCol)
      user.setEmail('marcio_martelini@hotmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Márcio Martelini')
      app.save(user)
    }

    // 2. Ensure a Trip exists for this user
    let trip
    try {
      trip = app.findFirstRecordByData('trips', 'owner_id', user.id)
    } catch (_) {
      const tripsCol = app.findCollectionByNameOrId('trips')
      trip = new Record(tripsCol)
      trip.set('title', 'Férias em Paris')
      trip.set('destination', 'Paris, França')
      trip.set('start_date', '2026-06-10 12:00:00.000Z')
      trip.set('end_date', '2026-06-20 12:00:00.000Z')
      trip.set('owner_id', user.id)
      trip.set('status', 'planned')
      app.save(trip)
    }

    // 3. Seed Ticket (idempotent)
    const ticketsCol = app.findCollectionByNameOrId('tickets')
    try {
      app.findFirstRecordByFilter(
        'tickets',
        "viagem_id = {:viagemId} && origem = 'São Paulo (GRU)'",
        { viagemId: trip.id },
      )
    } catch (_) {
      const ticket = new Record(ticketsCol)
      ticket.set('viagem_id', trip.id)
      ticket.set('tipo', 'voo')
      ticket.set('numero_confirmacao', 'AF1234')
      ticket.set('origem', 'São Paulo (GRU)')
      ticket.set('destino', 'Paris (CDG)')
      ticket.set('data_saida', '2026-06-09 18:00:00.000Z')
      ticket.set('hora_saida', '18:00')
      ticket.set('data_chegada', '2026-06-10 10:00:00.000Z')
      ticket.set('hora_chegada', '10:00')
      ticket.set('companhia', 'Air France')
      ticket.set('preco', 4500.0)
      ticket.set('moeda', 'BRL')
      ticket.set('status', 'confirmado')
      app.save(ticket)
    }

    // 4. Seed Reserva (idempotent)
    const reservasCol = app.findCollectionByNameOrId('reservas')
    try {
      app.findFirstRecordByFilter('reservas', "viagem_id = {:viagemId} && nome = 'Hotel Louvre'", {
        viagemId: trip.id,
      })
    } catch (_) {
      const reserva = new Record(reservasCol)
      reserva.set('viagem_id', trip.id)
      reserva.set('tipo', 'hotel')
      reserva.set('nome', 'Hotel Louvre')
      reserva.set('local', 'Rue de Rivoli, Paris')
      reserva.set('data_checkin', '2026-06-10 14:00:00.000Z')
      reserva.set('hora_checkin', '14:00')
      reserva.set('data_checkout', '2026-06-20 12:00:00.000Z')
      reserva.set('hora_checkout', '12:00')
      reserva.set('numero_confirmacao', 'HL-98765')
      reserva.set('preco', 1200.0)
      reserva.set('moeda', 'EUR')
      reserva.set('status', 'confirmado')
      reserva.set('notas', 'Quarto com vista para a torre.')
      app.save(reserva)
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
      const trip = app.findFirstRecordByData('trips', 'owner_id', user.id)

      try {
        const t = app.findFirstRecordByFilter(
          'tickets',
          "viagem_id = {:viagemId} && origem = 'São Paulo (GRU)'",
          { viagemId: trip.id },
        )
        app.delete(t)
      } catch (_) {}

      try {
        const r = app.findFirstRecordByFilter(
          'reservas',
          "viagem_id = {:viagemId} && nome = 'Hotel Louvre'",
          { viagemId: trip.id },
        )
        app.delete(r)
      } catch (_) {}
    } catch (_) {}
  },
)
