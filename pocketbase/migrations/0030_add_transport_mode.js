migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')

    if (!col.fields.getByName('meio_transporte')) {
      col.fields.add(
        new SelectField({
          name: 'meio_transporte',
          values: ['carro', 'andando', 'transporte_publico', 'bicicleta'],
          maxSelect: 1,
        }),
      )
      app.save(col)
    }

    // Update existing records to have 'carro' as default
    app
      .db()
      .newQuery(
        "UPDATE itinerario SET meio_transporte = 'carro' WHERE meio_transporte = '' OR meio_transporte IS NULL",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')

    if (col.fields.getByName('meio_transporte')) {
      col.fields.removeByName('meio_transporte')
      app.save(col)
    }
  },
)
