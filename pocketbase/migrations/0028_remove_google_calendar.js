migrate(
  (app) => {
    // Remove integracao_google_calendar collection
    try {
      const col = app.findCollectionByNameOrId('integracao_google_calendar')
      app.delete(col)
    } catch (_) {}

    // Remove google_calendar_id from trips
    try {
      const tripsCol = app.findCollectionByNameOrId('trips')
      if (tripsCol.fields.getByName('google_calendar_id')) {
        tripsCol.fields.removeByName('google_calendar_id')
        app.save(tripsCol)
      }
    } catch (_) {}

    // Remove google_event_id from itinerario
    try {
      const itinerarioCol = app.findCollectionByNameOrId('itinerario')
      if (itinerarioCol.fields.getByName('google_event_id')) {
        itinerarioCol.fields.removeByName('google_event_id')
        app.save(itinerarioCol)
      }
    } catch (_) {}
  },
  (app) => {
    // Add back fields and collection if reverting
    const Collection = require('pocketbase/models').Collection
    const TextField = require('pocketbase/models/schema').TextField

    try {
      const tripsCol = app.findCollectionByNameOrId('trips')
      if (!tripsCol.fields.getByName('google_calendar_id')) {
        tripsCol.fields.add(new TextField({ name: 'google_calendar_id' }))
        app.save(tripsCol)
      }
    } catch (_) {}

    try {
      const itinerarioCol = app.findCollectionByNameOrId('itinerario')
      if (!itinerarioCol.fields.getByName('google_event_id')) {
        itinerarioCol.fields.add(new TextField({ name: 'google_event_id' }))
        app.save(itinerarioCol)
      }
    } catch (_) {}
  },
)
