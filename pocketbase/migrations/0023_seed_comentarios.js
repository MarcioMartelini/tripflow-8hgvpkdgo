migrate(
  (app) => {
    const comentarios = app.findCollectionByNameOrId('comentarios')

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
      const trip = app.findFirstRecordByFilter('trips', `owner_id = '${user.id}'`)
      const atividade = app.findFirstRecordByFilter('itinerario', `viagem_id = '${trip.id}'`)

      try {
        app.findFirstRecordByData('comentarios', 'atividade_id', atividade.id)
        return
      } catch (_) {}

      const record = new Record(comentarios)
      record.set('atividade_id', atividade.id)
      record.set('usuario_id', user.id)
      record.set('viagem_id', trip.id)
      record.set(
        'texto',
        'Lembrar de chegar 30 minutos antes para o check-in e levar os documentos impressos.',
      )
      app.save(record)
    } catch (err) {
      console.log('Could not seed comentarios: ' + err)
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
      const records = app.findRecordsByFilter(
        'comentarios',
        `usuario_id = '${user.id}'`,
        '',
        100,
        0,
      )
      records.forEach((r) => app.delete(r))
    } catch (_) {}
  },
)
