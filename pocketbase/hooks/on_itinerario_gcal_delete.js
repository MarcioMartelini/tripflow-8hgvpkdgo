onRecordAfterDeleteSuccess((e) => {
  const ev = e.record
  const googleEventId = ev.getString('google_event_id')
  if (!googleEventId) return e.next()

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

  $http.send({
    url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
    timeout: 15,
  })

  return e.next()
}, 'itinerario')
