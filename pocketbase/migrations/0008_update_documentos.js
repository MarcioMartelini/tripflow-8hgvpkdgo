migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('documentos')
    } catch (err) {
      let tripsId = 'trips'
      try {
        tripsId = app.findCollectionByNameOrId('trips').id
      } catch (e) {}

      col = new Collection({
        name: 'documentos',
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
          {
            name: 'viagem_id',
            type: 'relation',
            required: true,
            collectionId: tripsId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'tipo', type: 'text', required: true },
          { name: 'nome_arquivo', type: 'text', required: true },
          { name: 'url_arquivo', type: 'url' },
          { name: 'data_expiracao', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(col)
      col = app.findCollectionByNameOrId('documentos')
    }

    // Update API Rules for strict data isolation
    col.listRule = 'usuario_id = @request.auth.id'
    col.viewRule = 'usuario_id = @request.auth.id'
    col.createRule = "@request.auth.id != ''"
    col.updateRule = 'usuario_id = @request.auth.id'
    col.deleteRule = 'usuario_id = @request.auth.id'

    // Ensure file upload field
    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    // Ensure notes field
    if (!col.fields.getByName('notas')) {
      col.fields.add(
        new TextField({
          name: 'notas',
        }),
      )
    }

    // Add index for performance
    try {
      col.addIndex('idx_documentos_usuario_viagem', false, 'usuario_id, viagem_id', '')
    } catch (e) {}

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('documentos')

      // Revert API Rules
      col.listRule = "@request.auth.id != ''"
      col.viewRule = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule = "@request.auth.id != ''"

      // Revert fields and index
      if (col.fields.getByName('arquivo')) {
        col.fields.removeByName('arquivo')
      }
      if (col.fields.getByName('notas')) {
        col.fields.removeByName('notas')
      }

      try {
        col.removeIndex('idx_documentos_usuario_viagem')
      } catch (e) {}

      app.save(col)
    } catch (e) {}
  },
)
