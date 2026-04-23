migrate(
  (app) => {
    app.db().newQuery('DELETE FROM documentos').execute()

    const col = app.findCollectionByNameOrId('documentos')

    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')

    if (col.fields.getByName('arquivo')) {
      col.fields.removeByName('arquivo')
    }

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    app.save(col)
  },
)
