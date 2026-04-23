migrate(
  (app) => {
    const tripsCol = app.findCollectionByNameOrId('trips')

    const events = new Collection({
      name: 'events',
      type: 'base',
      listRule: "@request.auth.id != '' && trip_id.owner_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && trip_id.owner_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && trip_id.owner_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && trip_id.owner_id = @request.auth.id",
      fields: [
        {
          name: 'trip_id',
          type: 'relation',
          required: true,
          collectionId: tripsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['voo', 'hotel', 'atividade'],
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'time', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(events)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('events'))
  },
)
