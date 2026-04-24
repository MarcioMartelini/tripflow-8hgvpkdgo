routerAdd(
  'POST',
  '/backend/v1/users/delete-account',
  (e) => {
    const user = e.auth
    if (!user) throw new UnauthorizedError('Authentication required')

    const body = e.requestInfo().body || {}
    const password = body.password
    if (!password) throw new BadRequestError('Senha é obrigatória')

    if (!user.validatePassword(password)) {
      throw new BadRequestError('Senha incorreta', {
        password: new ValidationError('invalid_password', 'Senha incorreta'),
      })
    }

    const userId = user.id
    const db = $app

    const logsCol = db.findCollectionByNameOrId('logs_auditoria')
    const logRecord = new Record(logsCol)
    logRecord.set('usuario_id', userId)
    logRecord.set('acao', 'direito_ao_esquecimento')
    logRecord.set('email', user.getString('email'))
    db.save(logRecord)

    try {
      db.runInTransaction((txApp) => {
        const trips = txApp.findRecordsByFilter('trips', 'owner_id = {:userId}', '', 0, 0, {
          userId,
        })
        for (const t of trips) {
          txApp.delete(t)
        }

        const docs = txApp.findRecordsByFilter('documentos', 'usuario_id = {:userId}', '', 0, 0, {
          userId,
        })
        for (const d of docs) {
          txApp.delete(d)
        }

        const collections = [
          'despesas',
          'alertas',
          'comentarios',
          'chaves_usuario',
          'sincronizacao_offline',
          'conflitos_offline',
          'compartilhamento_documentos',
        ]
        for (const coll of collections) {
          const field =
            coll === 'compartilhamento_documentos' ? 'usuario_compartilhador' : 'usuario_id'
          const records = txApp.findRecordsByFilter(coll, field + ' = {:userId}', '', 0, 0, {
            userId,
          })
          for (const r of records) {
            txApp.delete(r)
          }
        }

        txApp.delete(user)
      })
    } catch (err) {
      throw new InternalServerError('Erro ao deletar conta: ' + err.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
