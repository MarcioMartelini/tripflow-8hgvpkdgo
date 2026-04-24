migrate(
  (app) => {
    const collection = new Collection({
      name: 'conflitos_offline',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['atividade', 'despesa', 'comentario', 'outro'],
          maxSelect: 1,
        },
        { name: 'dados_originais', type: 'json', required: false },
        { name: 'dados_conflitantes', type: 'json', required: false },
        { name: 'data_conflito', type: 'date', required: true },
        { name: 'resolvido', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('conflitos_offline')
    app.delete(collection)
  },
)
