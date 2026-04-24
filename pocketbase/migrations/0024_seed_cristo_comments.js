migrate(
  (app) => {
    try {
      const activity = app.findFirstRecordByData(
        'itinerario',
        'atividade',
        'Visita Cristo Redentor',
      )
      const tripId = activity.get('viagem_id')

      const usersCol = app.findCollectionByNameOrId('users')

      let u1, u2, u3

      try {
        u1 = app.findAuthRecordByEmail('users', 'marcio@mock.com')
      } catch (_) {
        u1 = new Record(usersCol)
        u1.setEmail('marcio@mock.com')
        u1.setPassword('Skip@Pass')
        u1.setVerified(true)
        u1.set('name', 'Marcio Silva')
        app.save(u1)
      }

      try {
        u2 = app.findAuthRecordByEmail('users', 'ana@mock.com')
      } catch (_) {
        u2 = new Record(usersCol)
        u2.setEmail('ana@mock.com')
        u2.setPassword('Skip@Pass')
        u2.setVerified(true)
        u2.set('name', 'Ana Costa')
        app.save(u2)
      }

      try {
        u3 = app.findAuthRecordByEmail('users', 'carlos@mock.com')
      } catch (_) {
        u3 = new Record(usersCol)
        u3.setEmail('carlos@mock.com')
        u3.setPassword('Skip@Pass')
        u3.setVerified(true)
        u3.set('name', 'Carlos Oliveira')
        app.save(u3)
      }

      const comentariosCol = app.findCollectionByNameOrId('comentarios')

      try {
        app.findFirstRecordByData('comentarios', 'texto', 'Vamos levar água e protetor solar!')
        return // Already seeded
      } catch (_) {}

      const c1 = new Record(comentariosCol)
      c1.set('atividade_id', activity.id)
      c1.set('usuario_id', u1.id)
      c1.set('viagem_id', tripId)
      c1.set('texto', 'Vamos levar água e protetor solar!')
      app.save(c1)

      const c2 = new Record(comentariosCol)
      c2.set('atividade_id', activity.id)
      c2.set('usuario_id', u2.id)
      c2.set('viagem_id', tripId)
      c2.set('texto', 'Ótima ideia! Que horas saímos do hotel?')
      app.save(c2)

      const c3 = new Record(comentariosCol)
      c3.set('atividade_id', activity.id)
      c3.set('usuario_id', u3.id)
      c3.set('viagem_id', tripId)
      c3.set('texto', 'Sugiro sair 8:30 para evitar multidão')
      app.save(c3)

      app
        .db()
        .newQuery(`
      UPDATE comentarios SET created = '2026-05-15 18:30:00.000Z' WHERE id = {:id}
    `)
        .bind({ id: c1.id })
        .execute()

      app
        .db()
        .newQuery(`
      UPDATE comentarios SET created = '2026-05-15 19:15:00.000Z' WHERE id = {:id}
    `)
        .bind({ id: c2.id })
        .execute()

      app
        .db()
        .newQuery(`
      UPDATE comentarios SET created = '2026-05-15 20:00:00.000Z' WHERE id = {:id}
    `)
        .bind({ id: c3.id })
        .execute()
    } catch (err) {
      console.log('Activity not found or other error', err)
    }
  },
  (app) => {
    try {
      const c1 = app.findFirstRecordByData(
        'comentarios',
        'texto',
        'Vamos levar água e protetor solar!',
      )
      app.delete(c1)
    } catch (_) {}
    try {
      const c2 = app.findFirstRecordByData(
        'comentarios',
        'texto',
        'Ótima ideia! Que horas saímos do hotel?',
      )
      app.delete(c2)
    } catch (_) {}
    try {
      const c3 = app.findFirstRecordByData(
        'comentarios',
        'texto',
        'Sugiro sair 8:30 para evitar multidão',
      )
      app.delete(c3)
    } catch (_) {}
  },
)
