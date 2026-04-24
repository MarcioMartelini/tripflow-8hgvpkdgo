migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')

    if (!col.fields.getByName('iv')) {
      col.fields.add(new TextField({ name: 'iv', required: true }))
    }
    if (!col.fields.getByName('nome_arquivo_original')) {
      col.fields.add(new TextField({ name: 'nome_arquivo_original', required: false }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    col.fields.removeByName('iv')
    col.fields.removeByName('nome_arquivo_original')
    app.save(col)
  },
)
