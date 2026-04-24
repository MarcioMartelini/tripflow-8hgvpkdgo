migrate(
  (app) => {
    const collections = ['itinerario', 'tickets', 'reservas']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.fields.add(
        new SelectField({
          name: 'categoria',
          values: ['hospedagem', 'transporte', 'alimentação', 'atividade', 'compras', 'outro'],
          maxSelect: 1,
        }),
      )
      col.fields.add(
        new TextField({
          name: 'categoria_outro_descricao',
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const collections = ['itinerario', 'tickets', 'reservas']
    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.fields.removeByName('categoria')
      col.fields.removeByName('categoria_outro_descricao')
      app.save(col)
    }
  },
)
