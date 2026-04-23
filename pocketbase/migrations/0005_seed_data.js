migrate((app) => {
  // 1. Seed user
  const users = app.findCollectionByNameOrId('_pb_users_auth_')
  let user
  try {
    user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
  } catch (_) {
    user = new Record(users)
    user.setEmail('marcio_martelini@hotmail.com')
    user.setPassword('Skip@Pass')
    user.setVerified(true)
    user.set('name', 'Márcio')
    app.save(user)
  }

  // 2. Seed trips
  const trips = app.findCollectionByNameOrId('trips')
  const tripsData = [
    {
      title: 'Rio de Janeiro 2026',
      destination: 'Rio de Janeiro, RJ',
      start_date: '2026-05-15 12:00:00.000Z',
      end_date: '2026-05-22 12:00:00.000Z',
      travelers_count: 3,
      progress: 60,
      budget_total: 5000,
      status: 'planned',
      owner_id: user.id,
    },
    {
      title: 'São Paulo Business',
      destination: 'São Paulo, SP',
      start_date: '2026-06-10 12:00:00.000Z',
      end_date: '2026-06-12 12:00:00.000Z',
      travelers_count: 2,
      progress: 30,
      budget_total: 2500,
      status: 'ongoing',
      owner_id: user.id,
    },
    {
      title: 'Bahia Férias',
      destination: 'Salvador, BA',
      start_date: '2026-07-01 12:00:00.000Z',
      end_date: '2026-07-15 12:00:00.000Z',
      travelers_count: 3,
      progress: 10,
      budget_total: 8000,
      status: 'planned',
      owner_id: user.id,
    },
  ]

  const createdTrips = []
  for (const t of tripsData) {
    let record
    try {
      record = app.findFirstRecordByData('trips', 'title', t.title)
    } catch (_) {
      record = new Record(trips)
      Object.keys(t).forEach((k) => record.set(k, t[k]))
      app.save(record)
    }
    createdTrips.push(record)
  }

  // 3. Seed events
  const events = app.findCollectionByNameOrId('events')
  const eventsData = [
    {
      trip_id: createdTrips[0].id,
      type: 'voo',
      date: '2026-05-15 12:00:00.000Z',
      time: '08:30',
      description: 'Voo G3 1234 para GIG',
    },
    {
      trip_id: createdTrips[0].id,
      type: 'hotel',
      date: '2026-05-15 12:00:00.000Z',
      time: '14:00',
      description: 'Check-in Hotel Copacabana',
    },
    {
      trip_id: createdTrips[0].id,
      type: 'atividade',
      date: '2026-05-16 12:00:00.000Z',
      time: '10:00',
      description: 'Visita ao Cristo Redentor',
    },
    {
      trip_id: createdTrips[1].id,
      type: 'voo',
      date: '2026-06-10 12:00:00.000Z',
      time: '07:00',
      description: 'Voo Ponte Aérea CGH',
    },
    {
      trip_id: createdTrips[1].id,
      type: 'atividade',
      date: '2026-06-10 12:00:00.000Z',
      time: '15:00',
      description: 'Reunião Cliente X',
    },
  ]

  for (const ev of eventsData) {
    try {
      app.findFirstRecordByData('events', 'description', ev.description)
    } catch (_) {
      const record = new Record(events)
      Object.keys(ev).forEach((k) => record.set(k, ev[k]))
      app.save(record)
    }
  }
})
