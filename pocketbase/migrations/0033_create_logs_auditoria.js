migrate(
  (app) => {
    const collection = new Collection({
      name: 'logs_auditoria',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'usuario_id', type: 'text', required: true },
        { name: 'acao', type: 'text', required: true },
        { name: 'email', type: 'email', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('logs_auditoria')
    app.delete(collection)
  },
)
