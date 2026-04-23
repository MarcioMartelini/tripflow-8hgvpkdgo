migrate(
  (app) => {
    // Truncate existing to prevent NOT NULL constraint failures when adding required file field
    app.db().newQuery('DELETE FROM documentos').execute()

    const col = app.findCollectionByNameOrId('documentos')
    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          required: true,
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    // Privacy and Access Control strict rules
    col.listRule =
      "@request.auth.id != '' && usuario_id = @request.auth.id && viagem_id.owner_id = @request.auth.id"
    col.viewRule =
      "@request.auth.id != '' && usuario_id = @request.auth.id && viagem_id.owner_id = @request.auth.id"
    col.createRule =
      "@request.auth.id != '' && usuario_id = @request.auth.id && viagem_id.owner_id = @request.auth.id"
    col.updateRule =
      "@request.auth.id != '' && usuario_id = @request.auth.id && viagem_id.owner_id = @request.auth.id"
    col.deleteRule =
      "@request.auth.id != '' && usuario_id = @request.auth.id && viagem_id.owner_id = @request.auth.id"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    if (col.fields.getByName('arquivo')) {
      col.fields.removeByName('arquivo')
    }

    // Revert back to original access control rules
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)
  },
)
