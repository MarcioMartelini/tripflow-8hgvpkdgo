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
      user.set('name', 'Márcio Martelini')
      app.save(user)
    }

    const trips = app.findCollectionByNameOrId('trips')

    try {
      app.findFirstRecordByData('trips', 'title', 'Férias em Paris')
    } catch (_) {
      const trip1 = new Record(trips)
      trip1.set('title', 'Férias em Paris')
      trip1.set('destination', 'Paris, França')
      trip1.set('start_date', '2026-06-01 10:00:00.000Z')
      trip1.set('end_date', '2026-06-15 20:00:00.000Z')
      trip1.set('owner_id', user.id)
      trip1.set('status', 'planned')
      app.save(trip1)
    }

    try {
      app.findFirstRecordByData('trips', 'title', 'Trabalho em Tóquio')
    } catch (_) {
      const trip2 = new Record(trips)
      trip2.set('title', 'Trabalho em Tóquio')
      trip2.set('destination', 'Tóquio, Japão')
      trip2.set('start_date', '2026-08-10 08:00:00.000Z')
      trip2.set('end_date', '2026-08-20 18:00:00.000Z')
      trip2.set('owner_id', user.id)
      trip2.set('status', 'planned')
      app.save(trip2)
    }
  },
  (app) => {
    try {
      const trip1 = app.findFirstRecordByData('trips', 'title', 'Férias em Paris')
      app.delete(trip1)
    } catch (_) {}
    try {
      const trip2 = app.findFirstRecordByData('trips', 'title', 'Trabalho em Tóquio')
      app.delete(trip2)
    } catch (_) {}
  },
)
