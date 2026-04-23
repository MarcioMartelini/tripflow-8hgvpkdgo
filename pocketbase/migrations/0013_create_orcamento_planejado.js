migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')

    const collection = new Collection({
      name: 'orcamento_planejado',
      type: 'base',
      listRule: 'viagem_id.owner_id = @request.auth.id',
      viewRule: 'viagem_id.owner_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'viagem_id.owner_id = @request.auth.id',
      deleteRule: 'viagem_id.owner_id = @request.auth.id',
      fields: [
        {
          name: 'viagem_id',
          type: 'relation',
          required: true,
          collectionId: trips.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['hospedagem', 'transporte', 'alimentação', 'atividades', 'compras', 'outro'],
          maxSelect: 1,
        },
        { name: 'valor_planejado', type: 'number', required: true },
        { name: 'moeda', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })

    app.save(collection)

    // Ensure existing despesas matches the requested structure
    // It already does, but we save it to apply any potential rule validations
    const despesas = app.findCollectionByNameOrId('despesas')
    app.save(despesas)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('orcamento_planejado')
    app.delete(collection)
  },
)
