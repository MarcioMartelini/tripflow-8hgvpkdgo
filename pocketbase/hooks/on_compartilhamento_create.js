onRecordAfterCreateSuccess((e) => {
  const logs = $app.findCollectionByNameOrId('logs_auditoria')
  const logRecord = new Record(logs)
  logRecord.set('usuario_id', e.record.getString('usuario_compartilhador'))
  logRecord.set(
    'acao',
    'compartilhamento_documento: doc=' +
      e.record.getString('documento_id') +
      ' receptor=' +
      e.record.getString('usuario_receptor'),
  )
  $app.save(logRecord)

  const alertas = $app.findCollectionByNameOrId('alertas')
  const alerta = new Record(alertas)
  alerta.set('usuario_id', e.record.getString('usuario_receptor'))
  alerta.set('tipo', 'documento')
  try {
    const sender = $app.findRecordById(
      '_pb_users_auth_',
      e.record.getString('usuario_compartilhador'),
    )
    alerta.set('mensagem', sender.getString('name') + ' compartilhou um documento com você')
    alerta.set('lido', false)
    $app.save(alerta)
  } catch (err) {}

  e.next()
}, 'compartilhamento_documentos')
