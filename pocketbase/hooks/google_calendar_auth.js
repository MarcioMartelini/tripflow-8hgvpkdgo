// @deps
routerAdd(
  'GET',
  '/backend/v1/google-calendar/auth-url',
  (e) => {
    const clientId = $secrets.get('GOOGLE_CLIENT_ID')
    if (!clientId)
      return e.badRequestError(
        'Google Client ID not configured. Please set GOOGLE_CLIENT_ID secret.',
      )

    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Authentication required')

    const stateSecret = $secrets.get('GOOGLE_CLIENT_SECRET') || 'fallback_secret'
    const state = $security.createJWT({ id: userId }, stateSecret, 3600)

    const redirectUri = `https://${e.request.host}/backend/v1/google-calendar/callback`
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events')

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`

    return e.json(200, { url })
  },
  $apis.requireAuth(),
)
