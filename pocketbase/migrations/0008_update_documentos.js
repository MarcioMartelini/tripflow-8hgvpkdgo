migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')

    // Update API Rules for strict data isolation
    col.listRule = 'usuario_id = @request.auth.id'
    col.viewRule = 'usuario_id = @request.auth.id'
    col.createRule = "@request.auth.id != ''"
    col.updateRule = 'usuario_id = @request.auth.id'
    col.deleteRule = 'usuario_id = @request.auth.id'

    // Ensure file upload field
    if (!col.fields.getByName('arquivo')) {
      const { FileField } = require('pocketbase/models/schema') // For illustration, but we use the global new FileField in context
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
    col.addIndex('idx_documentos_usuario_viagem', false, 'usuario_id, viagem_id', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')

    // Revert API Rules
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    // Revert fields and index
    col.removeField('arquivo')
    col.removeField('notas')
    col.removeIndex('idx_documentos_usuario_viagem')

    app.save(col)
  },
)
