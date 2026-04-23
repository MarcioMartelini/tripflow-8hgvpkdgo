migrate(
  (app) => {
    const collection = new Collection({
      name: 'documentos',
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
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('trips').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['passaporte', 'visto', 'seguro', 'comprovante', 'outro'],
        },
        { name: 'nome_arquivo', type: 'text', required: true },
        { name: 'url_arquivo', type: 'url' },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        },
        { name: 'data_expiracao', type: 'date' },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('documentos')
      app.delete(collection)
    } catch (err) {}
  },
)
