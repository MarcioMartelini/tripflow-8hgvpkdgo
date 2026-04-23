migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    col.fields.removeByName('arquivo')
    app.save(col)
  },
)
