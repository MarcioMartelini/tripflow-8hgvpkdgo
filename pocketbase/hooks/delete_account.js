routerAdd(
  'POST',
  '/backend/v1/users/delete-account',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Não autorizado')

    const body = e.requestInfo().body || {}
    if (!body.password) {
      return e.badRequestError('Senha é obrigatória', {
        password: new ValidationError('validation_required', 'Senha é obrigatória'),
      })
    }

    const userEmail = user.getString('email')

    // Verify password via internal API
    let baseUrl = $secrets.get('PB_INSTANCE_URL')
    if (!baseUrl) {
      baseUrl = 'http://127.0.0.1:8080'
    }
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

    const authRes = $http.send({
      url: baseUrl + '/api/collections/users/auth-with-password',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: userEmail, password: body.password }),
      timeout: 10,
    })

    if (authRes.statusCode !== 200) {
      return e.badRequestError('Senha incorreta', {
        password: new ValidationError('invalid_password', 'Senha incorreta'),
      })
    }

    $app.runInTransaction((txApp) => {
      const deleteRecords = (collection, filter) => {
        try {
          const records = txApp.findRecordsByFilter(collection, filter, '', 10000, 0)
          for (let i = 0; i < records.length; i++) {
            txApp.delete(records[i])
          }
        } catch (err) {
          // ignore if none found
        }
      }

      // 1. Fetch trips
      let trips = []
      try {
        trips = txApp.findRecordsByFilter('trips', `owner_id = '${user.id}'`, '', 1000, 0)
      } catch (err) {}

      // 2. Delete data related to trips
      for (let i = 0; i < trips.length; i++) {
        const tripId = trips[i].id
        deleteRecords('events', `trip_id = '${tripId}'`)
        deleteRecords('viajantes', `viagem_id = '${tripId}'`)
        deleteRecords('itinerario', `viagem_id = '${tripId}'`)
        deleteRecords('tickets', `viagem_id = '${tripId}'`)
        deleteRecords('reservas', `viagem_id = '${tripId}'`)
        deleteRecords('orcamento_planejado', `viagem_id = '${tripId}'`)
      }

      // 3. Delete user direct data
      const userFilter = `usuario_id = '${user.id}'`
      deleteRecords('documentos', userFilter)
      deleteRecords('despesas', userFilter)
      deleteRecords('alertas', userFilter)
      deleteRecords('comentarios', userFilter)
      deleteRecords('sincronizacao_offline', userFilter)
      deleteRecords('conflitos_offline', userFilter)
      deleteRecords('chaves_usuario', userFilter)

      // 4. Delete trips
      for (let i = 0; i < trips.length; i++) {
        txApp.delete(trips[i])
      }

      // 5. Create Audit Log
      try {
        const logsCol = txApp.findCollectionByNameOrId('logs_auditoria')
        const logRecord = new Record(logsCol)
        logRecord.set('usuario_id', user.id)
        logRecord.set('email', userEmail)
        logRecord.set('acao', 'direito_ao_esquecimento')
        txApp.save(logRecord)
      } catch (err) {
        $app.logger().error('Falha ao salvar log de auditoria', 'error', err.message)
      }

      // 6. Delete user
      txApp.delete(user)
    })

    // Log to simulate the email sending confirmation
    $app
      .logger()
      .info(
        'Email de confirmação enviado',
        'to',
        userEmail,
        'subject',
        'Sua conta foi deletada',
        'action',
        'direito_ao_esquecimento',
      )

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
