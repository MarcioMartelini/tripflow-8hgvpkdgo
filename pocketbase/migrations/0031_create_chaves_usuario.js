migrate(
  (app) => {
    const collection = new Collection({
      name: 'chaves_usuario',
      type: 'base',
      listRule: 'usuario_id = @request.auth.id',
      viewRule: 'usuario_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'usuario_id = @request.auth.id',
      deleteRule: 'usuario_id = @request.auth.id',
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'salt', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('chaves_usuario')
    app.delete(collection)
  },
)
