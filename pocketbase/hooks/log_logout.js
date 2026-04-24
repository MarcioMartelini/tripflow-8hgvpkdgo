routerAdd(
  'POST',
  '/backend/v1/users/logout',
  (e) => {
    const user = e.auth
    if (user) {
      const db = $app
      const logsCol = db.findCollectionByNameOrId('logs_auditoria')
      const logRecord = new Record(logsCol)
      logRecord.set('usuario_id', user.id)
      logRecord.set('acao', 'logout')
      logRecord.set('email', user.getString('email'))
      db.save(logRecord)
    }
    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
