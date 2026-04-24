migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('compartilhamento_documentos')
    col.addIndex('idx_comp_docs_documento', false, 'documento_id', '')
    col.addIndex('idx_comp_docs_compartilhador', false, 'usuario_compartilhador', '')
    col.addIndex('idx_comp_docs_receptor', false, 'usuario_receptor', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('compartilhamento_documentos')
    col.removeIndex('idx_comp_docs_documento')
    col.removeIndex('idx_comp_docs_compartilhador')
    col.removeIndex('idx_comp_docs_receptor')
    app.save(col)
  },
)
