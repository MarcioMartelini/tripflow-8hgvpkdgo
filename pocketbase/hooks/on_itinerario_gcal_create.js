onRecordAfterCreateSuccess((e) => {
  const ev = e.record
  const tripId = ev.getString('viagem_id')
  let trip
  try {
    trip = $app.findRecordById('trips', tripId)
  } catch (err) {
    return e.next()
  }
  const calendarId = trip.getString('google_calendar_id')
  if (!calendarId) return e.next()

  const userId = trip.getString('owner_id')
  let integration
  try {
    integration = $app.findFirstRecordByData('integracao_google_calendar', 'usuario_id', userId)
  } catch (err) {
    return e.next()
  }
  if (!integration.getBool('conectado') || !integration.getString('token_refresh')) {
    return e.next()
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
    return e.next()
  }

  const dataStr = ev.getString('data').substring(0, 10)
  const startStr =
    dataStr + 'T' + (ev.getString('hora_inicio') || '09:00').padStart(5, '0') + ':00-03:00'

  let endStr = dataStr + 'T' + (ev.getString('hora_fim') || '10:00').padStart(5, '0') + ':00-03:00'
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
    const freshEv = $app.findRecordById('itinerario', ev.id)
    freshEv.set('google_event_id', evRes.json.id)
    $app.save(freshEv)
  }

  return e.next()
}, 'itinerario')
