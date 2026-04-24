migrate(
  (app) => {
    const collection = new Collection({
      name: 'compartilhamento_documentos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_compartilhador = @request.auth.id || usuario_receptor = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (usuario_compartilhador = @request.auth.id || usuario_receptor = @request.auth.id)",
      createRule: "@request.auth.id != '' && usuario_compartilhador = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_compartilhador = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_compartilhador = @request.auth.id",
      fields: [
        {
          name: 'documento_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('documentos').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_compartilhador',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'usuario_receptor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'consentimento_dado', type: 'bool', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('compartilhamento_documentos')
    app.delete(collection)
  },
)
