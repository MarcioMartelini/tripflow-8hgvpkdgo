migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    const tArquivo = tickets.fields.getByName('arquivo')
    if (tArquivo) {
      tArquivo.maxSelect = 10
      tArquivo.mimeTypes = ['application/pdf']
    }
    app.save(tickets)

    const reservas = app.findCollectionByNameOrId('reservas')
    const rArquivo = reservas.fields.getByName('arquivo')
    if (rArquivo) {
      rArquivo.maxSelect = 10
      rArquivo.mimeTypes = ['application/pdf']
    }
    app.save(reservas)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    const iArquivos = itinerario.fields.getByName('arquivos')
    if (iArquivos) {
      iArquivos.maxSelect = 10
      iArquivos.mimeTypes = ['application/pdf']
    }
    app.save(itinerario)

    const despesas = app.findCollectionByNameOrId('despesas')
    if (!despesas.fields.getByName('arquivos')) {
      despesas.fields.add(
        new FileField({
          name: 'arquivos',
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
    }
    app.save(despesas)
  },
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    const tArquivo = tickets.fields.getByName('arquivo')
    if (tArquivo) {
      tArquivo.maxSelect = 1
      tArquivo.mimeTypes = []
    }
    app.save(tickets)

    const reservas = app.findCollectionByNameOrId('reservas')
    const rArquivo = reservas.fields.getByName('arquivo')
    if (rArquivo) {
      rArquivo.maxSelect = 1
      rArquivo.mimeTypes = []
    }
    app.save(reservas)

    const itinerario = app.findCollectionByNameOrId('itinerario')
    const iArquivos = itinerario.fields.getByName('arquivos')
    if (iArquivos) {
      iArquivos.maxSelect = 1
      iArquivos.mimeTypes = []
    }
    app.save(itinerario)

    const despesas = app.findCollectionByNameOrId('despesas')
    const dArquivos = despesas.fields.getByName('arquivos')
    if (dArquivos) {
      despesas.fields.removeByName('arquivos')
    }
    app.save(despesas)
  },
)
