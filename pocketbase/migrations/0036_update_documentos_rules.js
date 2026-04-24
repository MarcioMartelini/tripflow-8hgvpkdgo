migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    col.listRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || compartilhamento_documentos_via_documento_id.usuario_receptor ?= @request.auth.id)"
    col.viewRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || compartilhamento_documentos_via_documento_id.usuario_receptor ?= @request.auth.id)"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    col.listRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    app.save(col)
  },
)
