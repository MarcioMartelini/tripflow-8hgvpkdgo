migrate(
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')
    trips.fields.add(new NumberField({ name: 'latitude' }))
    trips.fields.add(new NumberField({ name: 'longitude' }))
    app.save(trips)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    itinerario.fields.add(new NumberField({ name: 'latitude' }))
    itinerario.fields.add(new NumberField({ name: 'longitude' }))
    app.save(itinerario)
  },
  (app) => {
    const trips = app.findCollectionByNameOrId('trips')
    trips.fields.removeByName('latitude')
    trips.fields.removeByName('longitude')
    app.save(trips)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    itinerario.fields.removeByName('latitude')
    itinerario.fields.removeByName('longitude')
    app.save(itinerario)
  },
)
