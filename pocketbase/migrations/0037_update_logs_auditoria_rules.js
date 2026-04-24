migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('logs_auditoria')
    col.listRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('logs_auditoria')
    col.listRule = null
    col.viewRule = null
    app.save(col)
  },
)
