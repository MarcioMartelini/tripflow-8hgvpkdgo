migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('trips')

    if (!col.fields.getByName('travelers_count')) {
      col.fields.add(new NumberField({ name: 'travelers_count', min: 1 }))
    }
    if (!col.fields.getByName('budget_total')) {
      col.fields.add(new NumberField({ name: 'budget_total', min: 0 }))
    }
    if (!col.fields.getByName('progress')) {
      col.fields.add(new NumberField({ name: 'progress', min: 0, max: 100 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('trips')
    col.fields.removeByName('travelers_count')
    col.fields.removeByName('budget_total')
    col.fields.removeByName('progress')
    app.save(col)
  },
)
