migrate(
  (app) => {
    const collection = new Collection({
      name: 'trips',
      type: 'base',
      listRule: 'owner_id = @request.auth.id',
      viewRule: 'owner_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'owner_id = @request.auth.id',
      deleteRule: 'owner_id = @request.auth.id',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'destination', type: 'text', required: true },
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        {
          name: 'owner_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['planned', 'ongoing', 'completed'],
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('trips')
    app.delete(collection)
  },
)
