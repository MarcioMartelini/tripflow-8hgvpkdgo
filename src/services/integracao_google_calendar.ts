import pb from '@/lib/pocketbase/client'

export interface IntegracaoGoogleCalendar {
  id: string
  usuario_id: string
  google_calendar_id?: string
  token_acesso?: string
  token_refresh?: string
  conectado: boolean
  created: string
  updated: string
}

export const getIntegracaoGoogleCalendar = (userId: string) =>
  pb
    .collection('integracao_google_calendar')
    .getFirstListItem<IntegracaoGoogleCalendar>(`usuario_id = "${userId}"`)
    .catch(() => null)

export const saveIntegracaoGoogleCalendar = async (
  userId: string,
  data: Partial<Omit<IntegracaoGoogleCalendar, 'id' | 'usuario_id' | 'created' | 'updated'>>,
) => {
  const existing = await getIntegracaoGoogleCalendar(userId)
  if (existing) {
    return await pb
      .collection('integracao_google_calendar')
      .update<IntegracaoGoogleCalendar>(existing.id, data)
  } else {
    return await pb.collection('integracao_google_calendar').create<IntegracaoGoogleCalendar>({
      usuario_id: userId,
      ...data,
    })
  }
}
