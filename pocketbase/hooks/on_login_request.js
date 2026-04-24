onRecordAuthRequest((e) => {
  const db = $app
  const user = e.record
  const logsCol = db.findCollectionByNameOrId('logs_auditoria')
  const logRecord = new Record(logsCol)
  logRecord.set('usuario_id', user.id)
  logRecord.set('acao', 'login')
  logRecord.set('email', user.getString('email'))
  db.save(logRecord)
  e.next()
}, 'users')
