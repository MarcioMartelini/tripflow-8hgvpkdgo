migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')
    col.fields.add(new NumberField({ name: 'preco' }))
    col.fields.add(new TextField({ name: 'moeda' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')
    col.fields.removeByName('preco')
    col.fields.removeByName('moeda')
    app.save(col)
  },
)
