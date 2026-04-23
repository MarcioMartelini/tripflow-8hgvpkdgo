migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('documentos')
    } catch (_) {
      const trips = app.findCollectionByNameOrId('trips')
      col = new Collection({
        name: 'documentos',
        type: 'base',
        listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
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
            collectionId: trips.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['passaporte', 'visto', 'seguro', 'comprovante', 'outro'],
            maxSelect: 1,
          },
          { name: 'nome_arquivo', type: 'text', required: true },
          { name: 'data_expiracao', type: 'date' },
          { name: 'notas', type: 'text' },
          {
            name: 'arquivo',
            type: 'file',
            required: true,
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['application/pdf'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(col)
      return
    }

    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('documentos')
      if (col.fields.getByName('arquivo')) {
        col.fields.removeByName('arquivo')
        app.save(col)
      }
    } catch (_) {}
  },
)
