migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itinerario')
    app.truncateCollection(col)
  },
  (app) => {
    // Data deletion cannot be reverted
  },
)
