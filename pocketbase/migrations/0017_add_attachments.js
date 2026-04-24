migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    if (!tickets.fields.getByName('arquivo')) {
      tickets.fields.add(
        new FileField({
          name: 'arquivo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
      app.save(tickets)
    }

    const reservas = app.findCollectionByNameOrId('reservas')
    if (!reservas.fields.getByName('arquivo')) {
      reservas.fields.add(
        new FileField({
          name: 'arquivo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
      app.save(reservas)
    }
  },
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    if (tickets.fields.getByName('arquivo')) {
      tickets.fields.removeByName('arquivo')
      app.save(tickets)
    }

    const reservas = app.findCollectionByNameOrId('reservas')
    if (reservas.fields.getByName('arquivo')) {
      reservas.fields.removeByName('arquivo')
      app.save(reservas)
    }
  },
)
