migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')
    trips.fields.add(new TextField({ name: 'google_calendar_id' }))
    app.save(trips)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    itinerario.fields.add(new TextField({ name: 'google_event_id' }))
    app.save(itinerario)
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')
    trips.fields.removeByName('google_calendar_id')
    app.save(trips)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    itinerario.fields.removeByName('google_event_id')
    app.save(itinerario)
  },
)
