cronAdd('check_alerts', '*/5 * * * *', () => {
  const now = new Date()
  const nowStr = now.toISOString().split('T')[0]

  const createAlert = (userId, tripId, tipo, mensagem) => {
    try {
      $app.findFirstRecordByFilter('alertas', 'usuario_id = {:userId} && mensagem = {:msg}', {
        userId,
        msg: mensagem,
      })
    } catch (_) {
      const col = $app.findCollectionByNameOrId('alertas')
      const record = new Record(col)
      record.set('usuario_id', userId)
      if (tripId) {
        record.set('viagem_id', tripId)
      }
      record.set('tipo', tipo)
      record.set('mensagem', mensagem)
      record.set('data_alerta', new Date().toISOString().replace('T', ' '))
      record.set('lido', false)
      $app.save(record)
    }
  }

  // 1. Flights
  try {
    const flights = $app.findRecordsByFilter(
      'tickets',
      "tipo = 'voo' && data_saida != ''",
      '-created',
      1000,
      0,
    )
    for (let f of flights) {
      const dataSaida = f.getString('data_saida').split(' ')[0]
      const horaSaida = f.getString('hora_saida')
      if (dataSaida && horaSaida) {
        const flightTime = new Date(`${dataSaida}T${horaSaida}:00Z`)
        const diffMs = flightTime.getTime() - now.getTime()
        if (diffMs > 1.75 * 60 * 60 * 1000 && diffMs <= 2.05 * 60 * 60 * 1000) {
          try {
            const trip = $app.findRecordById('trips', f.getString('viagem_id'))
            const comp = f.getString('companhia') || 'LATAM'
            createAlert(
              trip.getString('owner_id'),
              trip.id,
              'voo',
              `Seu voo ${comp} sai em 2 horas`,
            )
          } catch (_) {}
        }
      }
    }
  } catch (e) {}

  // 2. Hotel
  try {
    const hotels = $app.findRecordsByFilter(
      'reservas',
      "tipo = 'hotel' && data_checkin != ''",
      '-created',
      1000,
      0,
    )
    for (let h of hotels) {
      const dataCheckin = h.getString('data_checkin').split(' ')[0]
      const horaCheckin = h.getString('hora_checkin')
      if (dataCheckin && horaCheckin) {
        const checkinTime = new Date(`${dataCheckin}T${horaCheckin}:00Z`)
        const diffMs = checkinTime.getTime() - now.getTime()
        if (diffMs > 0.75 * 60 * 60 * 1000 && diffMs <= 1.05 * 60 * 60 * 1000) {
          try {
            const trip = $app.findRecordById('trips', h.getString('viagem_id'))
            const nome = h.getString('nome') || 'Copacabana'
            createAlert(
              trip.getString('owner_id'),
              trip.id,
              'hotel',
              `Check-in no hotel ${nome} em 1 hora`,
            )
          } catch (_) {}
        }
      }
    }
  } catch (e) {}

  // 3. Activity
  try {
    const activities = $app.findRecordsByFilter('itinerario', "data != ''", '-created', 1000, 0)
    for (let a of activities) {
      const data = a.getString('data').split(' ')[0]
      const horaInicio = a.getString('hora_inicio')
      if (data && horaInicio) {
        const actTime = new Date(`${data}T${horaInicio}:00Z`)
        const diffMs = actTime.getTime() - now.getTime()
        // 1 hour before (between 0.75 and 1.05 hours)
        if (diffMs > 0.75 * 60 * 60 * 1000 && diffMs <= 1.05 * 60 * 60 * 1000) {
          try {
            const trip = $app.findRecordById('trips', a.getString('viagem_id'))
            const nome = a.getString('atividade') || 'Cristo Redentor'
            createAlert(
              trip.getString('owner_id'),
              trip.id,
              'atividade',
              `Lembrete: A atividade '${nome}' começa em 1 hora.`,
            )
          } catch (_) {}
        }
      }
    }
  } catch (e) {}

  // 4. Documents
  try {
    const docs = $app.findRecordsByFilter('documentos', "data_expiracao != ''", '-created', 1000, 0)
    for (let d of docs) {
      const dataExp = d.getString('data_expiracao').split(' ')[0]
      if (dataExp) {
        const expTime = new Date(dataExp + 'T00:00:00Z').getTime()
        const todayTime = new Date(nowStr + 'T00:00:00Z').getTime()
        const daysDiff = Math.round((expTime - todayTime) / (1000 * 60 * 60 * 24))
        const tipo = d.getString('tipo') || 'visto'

        if (daysDiff === 30) {
          createAlert(
            d.getString('usuario_id'),
            d.getString('viagem_id'),
            'documento',
            `Seu ${tipo} expira em 30 dias`,
          )
        } else if (daysDiff === 0) {
          createAlert(
            d.getString('usuario_id'),
            d.getString('viagem_id'),
            'documento',
            `Seu ${tipo} expirou`,
          )
        }
      }
    }
  } catch (e) {}
})
