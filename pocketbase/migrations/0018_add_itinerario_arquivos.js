migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')
    col.fields.add(
      new FileField({
        name: 'arquivos',
        maxSelect: 10,
        maxSize: 10485760, // 10MB
        mimeTypes: ['application/pdf'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')
    col.fields.removeByName('arquivos')
    app.save(col)
  },
)
