routerAdd(
  'POST',
  '/backend/v1/trips/{id}/sync-gcal',
  (e) => {
    const tripId = e.request.pathValue('id')
    let trip
    try {
      trip = $app.findRecordById('trips', tripId)
    } catch (err) {
      return e.notFoundError('Viagem não encontrada')
    }

    const userId = trip.getString('owner_id')
    let integration
    try {
      integration = $app.findFirstRecordByData('integracao_google_calendar', 'usuario_id', userId)
    } catch (err) {
      return e.badRequestError('Google Calendar não conectado')
    }
    if (!integration.getBool('conectado') || !integration.getString('token_refresh')) {
      return e.badRequestError('Google Calendar não conectado')
    }

    const clientId = $secrets.get('GOOGLE_CLIENT_ID') || ''
    const clientSecret = $secrets.get('GOOGLE_CLIENT_SECRET') || ''
    let accessToken = integration.getString('token_acesso')

    const refreshRes = $http.send({
      url: 'https://oauth2.googleapis.com/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${integration.getString('token_refresh')}&grant_type=refresh_token`,
      timeout: 15,
    })

    if (refreshRes.statusCode === 200 && refreshRes.json.access_token) {
      accessToken = refreshRes.json.access_token
      integration.set('token_acesso', accessToken)
      $app.save(integration)
    } else {
      return e.badRequestError('Falha ao atualizar token do Google')
    }

    let calendarId = trip.getString('google_calendar_id')
    if (!calendarId) {
      const calRes = $http.send({
        url: 'https://www.googleapis.com/calendar/v3/calendars',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary: `TripFlow - ${trip.getString('title')}` }),
        timeout: 15,
      })

      if (calRes.statusCode === 200 && calRes.json.id) {
        calendarId = calRes.json.id
        trip.set('google_calendar_id', calendarId)
        $app.save(trip)
      } else {
        return e.badRequestError('Falha ao criar calendário no Google')
      }
    }

    const events = $app.findRecordsByFilter('itinerario', `viagem_id = '${tripId}'`, '', 0, 0)
    let synced = 0

    for (const ev of events) {
      if (ev.getString('google_event_id')) continue

      const dataStr = ev.getString('data').substring(0, 10)
      const startStr =
        dataStr + 'T' + (ev.getString('hora_inicio') || '09:00').padStart(5, '0') + ':00-03:00'

      let endStr =
        dataStr + 'T' + (ev.getString('hora_fim') || '10:00').padStart(5, '0') + ':00-03:00'
      if (!ev.getString('hora_fim') && ev.getString('hora_inicio')) {
        const [h, m] = ev.getString('hora_inicio').split(':')
        const endH = String((parseInt(h, 10) + 1) % 24).padStart(2, '0')
        endStr = dataStr + 'T' + endH + ':' + String(m).padStart(2, '0') + ':00-03:00'
      }

      const tipo = ev.getString('tipo')
      let overrideMins = null
      if (tipo === 'voo') overrideMins = 120
      else if (tipo === 'hotel') overrideMins = 60
      else if (tipo === 'atividade') overrideMins = 30

      const body = {
        summary: ev.getString('atividade') || 'Atividade',
        description: `Local: ${ev.getString('local') || '-'}\nNotas: ${ev.getString('notas') || '-'}`,
        start: { dateTime: startStr },
        end: { dateTime: endStr },
      }

      if (overrideMins) {
        body.reminders = {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: overrideMins }],
        }
      } else {
        body.reminders = { useDefault: true }
      }

      const evRes = $http.send({
        url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        timeout: 15,
      })

      if (evRes.statusCode === 200 && evRes.json.id) {
        ev.set('google_event_id', evRes.json.id)
        $app.save(ev)
        synced++
      }
    }

    return e.json(200, { success: true, calendarId, synced })
  },
  $apis.requireAuth(),
)
