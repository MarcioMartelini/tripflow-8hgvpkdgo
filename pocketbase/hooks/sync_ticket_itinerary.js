onRecordAfterCreateSuccess((e) => {
  const ticket = e.record
  const viagemId = ticket.get('viagem_id')
  const dataSaida = ticket.getString('data_saida')

  if (!viagemId || !dataSaida) return e.next()

  const tipo = ticket.getString('tipo') || 'outro'
  const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1)

  const origem = ticket.getString('origem')
  const destino = ticket.getString('destino')
  const companhia = ticket.getString('companhia')

  const atividade = `${tipoCap}: ${origem} -> ${destino} (${companhia})`

  let itinerarioTipo = 'outro'
  if (tipo === 'voo') itinerarioTipo = 'voo'

  const col = $app.findCollectionByNameOrId('itinerario')
  const record = new Record(col)

  record.set('viagem_id', viagemId)
  record.set('data', dataSaida)
  record.set('hora_inicio', ticket.getString('hora_saida'))
  record.set('hora_fim', ticket.getString('hora_chegada'))
  record.set('atividade', atividade)
  record.set('tipo', itinerarioTipo)
  record.set('local', origem)

  if (ticket.get('categoria')) {
    record.set('categoria', ticket.get('categoria'))
  }
  if (ticket.get('categoria_outro_descricao')) {
    record.set('categoria_outro_descricao', ticket.get('categoria_outro_descricao'))
  }

  $app.save(record)

  return e.next()
}, 'tickets')
