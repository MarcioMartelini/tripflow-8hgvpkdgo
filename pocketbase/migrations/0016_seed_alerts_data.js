migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      return // skip if user doesn't exist
    }

    const alertas = app.findCollectionByNameOrId('alertas')

    const seedAlert = (tipo, mensagem, data_alerta, lido) => {
      try {
        app.findFirstRecordByFilter('alertas', `usuario_id = {:userId} && mensagem = {:msg}`, {
          userId: user.id,
          msg: mensagem,
        })
      } catch (_) {
        const record = new Record(alertas)
        record.set('usuario_id', user.id)
        record.set('tipo', tipo)
        record.set('mensagem', mensagem)
        record.set('data_alerta', data_alerta)
        record.set('lido', lido)
        app.save(record)
      }
    }

    seedAlert('voo', 'Seu voo LATAM sai em 2 horas', '2026-05-15 12:00:00.000Z', false)
    seedAlert('hotel', 'Check-in no hotel Copacabana em 1 hora', '2026-05-15 17:00:00.000Z', false)
    seedAlert('documento', 'Seu visto expira em 30 dias', '2026-04-15 10:00:00.000Z', true)
    seedAlert(
      'atividade',
      'Atividade Cristo Redentor começa em 30 minutos',
      '2026-05-16 08:30:00.000Z',
      true,
    )
  },
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio_martelini@hotmail.com')
    } catch (_) {
      return
    }

    const msgs = [
      'Seu voo LATAM sai em 2 horas',
      'Check-in no hotel Copacabana em 1 hora',
      'Seu visto expira em 30 dias',
      'Atividade Cristo Redentor começa em 30 minutos',
    ]

    for (const msg of msgs) {
      try {
        const record = app.findFirstRecordByFilter(
          'alertas',
          `usuario_id = {:userId} && mensagem = {:msg}`,
          {
            userId: user.id,
            msg: msg,
          },
        )
        app.delete(record)
      } catch (_) {}
    }
  },
)
