onRecordAfterDeleteSuccess((e) => {
  const db = $app
  const logsCol = db.findCollectionByNameOrId('logs_auditoria')
  const logRecord = new Record(logsCol)
  logRecord.set('usuario_id', e.record.getString('usuario_compartilhador'))
  logRecord.set('acao', 'revogacao_compartilhamento')

  try {
    const user = db.findRecordById('users', e.record.getString('usuario_compartilhador'))
    logRecord.set('email', user.getString('email'))
  } catch (err) {}

  db.save(logRecord)
  e.next()
}, 'compartilhamento_documentos')
