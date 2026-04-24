// @deps
routerAdd('GET', '/backend/v1/google-calendar/callback', (e) => {
  const code = e.request.url.query().get('code')
  const state = e.request.url.query().get('state')

  if (!code || !state) return e.html(400, 'Missing code or state')

  const stateSecret = $secrets.get('GOOGLE_CLIENT_SECRET') || 'fallback_secret'
  let payload
  try {
    payload = $security.parseJWT(state, stateSecret)
  } catch (err) {
    return e.html(400, 'Invalid state token')
  }

  const userId = payload.id
  const clientId = $secrets.get('GOOGLE_CLIENT_ID')
  const clientSecret = $secrets.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return e.html(500, 'Google Client credentials not configured in secrets.')
  }

  const redirectUri = `https://${e.request.host}/backend/v1/google-calendar/callback`

  const res = $http.send({
    url: 'https://oauth2.googleapis.com/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `code=${encodeURIComponent(code)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&grant_type=authorization_code`,
    timeout: 15,
  })

  if (res.statusCode !== 200) {
    $app
      .logger()
      .error(
        'Google token exchange failed',
        'status',
        res.statusCode,
        'response',
        res.json || res.body,
      )
    return e.html(400, 'Failed to exchange token with Google.')
  }

  const tokens = res.json

  let record
  try {
    record = $app.findFirstRecordByData('integracao_google_calendar', 'usuario_id', userId)
  } catch (_) {
    const col = $app.findCollectionByNameOrId('integracao_google_calendar')
    record = new Record(col)
    record.set('usuario_id', userId)
  }

  record.set('token_acesso', tokens.access_token)
  if (tokens.refresh_token) {
    record.set('token_refresh', tokens.refresh_token)
  }
  record.set('conectado', true)
  $app.save(record)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Conectado</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #0f172a; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Conectado com sucesso!</h2>
        <p>Você já pode fechar esta janela.</p>
      </div>
      <script>
        if (window.opener) {
          window.opener.postMessage('google-calendar-connected', '*');
          setTimeout(() => window.close(), 1000);
        }
      </script>
    </body>
    </html>
  `
  return e.html(200, html)
})
