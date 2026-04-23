onRecordAfterCreateSuccess((e) => {
  const reserva = e.record
  const viagemId = reserva.get('viagem_id')
  const dataCheckin = reserva.getString('data_checkin')

  if (!viagemId || !dataCheckin) return e.next()

  const tipo = reserva.getString('tipo') || 'outro'
  const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1)
  const nome = reserva.getString('nome')

  const atividade = `${tipoCap}: ${nome}`

  let itinerarioTipo = 'outro'
  if (tipo === 'hotel') itinerarioTipo = 'hotel'
  else if (tipo === 'restaurante') itinerarioTipo = 'refeição'
  else if (tipo === 'atividade') itinerarioTipo = 'atividade'

  const col = $app.findCollectionByNameOrId('itinerario')
  const record = new Record(col)

  record.set('viagem_id', viagemId)
  record.set('data', dataCheckin)
  record.set('hora_inicio', reserva.getString('hora_checkin'))
  record.set('atividade', atividade)
  record.set('tipo', itinerarioTipo)
  record.set('local', reserva.getString('local'))

  $app.save(record)

  return e.next()
}, 'reservas')
