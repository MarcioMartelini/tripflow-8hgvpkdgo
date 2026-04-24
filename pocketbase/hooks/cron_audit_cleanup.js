cronAdd('audit_cleanup', '0 0 * * *', () => {
  try {
    const date90DaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const formatted90 = date90DaysAgo.toISOString().replace('T', ' ').substring(0, 19)

    const date1YearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const formatted1Year = date1YearAgo.toISOString().replace('T', ' ').substring(0, 19)

    const logs90 = $app.findRecordsByFilter(
      'logs_auditoria',
      `created < '${formatted90}' && acao !~ 'compartilhamento_documento' && acao !~ 'revogacao_acesso_documento'`,
      '',
      10000,
      0,
    )
    for (let i = 0; i < logs90.length; i++) {
      $app.delete(logs90[i])
    }

    const logs1Year = $app.findRecordsByFilter(
      'logs_auditoria',
      `created < '${formatted1Year}' && (acao ~ 'compartilhamento_documento' || acao ~ 'revogacao_acesso_documento')`,
      '',
      10000,
      0,
    )
    for (let i = 0; i < logs1Year.length; i++) {
      $app.delete(logs1Year[i])
    }
  } catch (err) {
    $app.logger().error('Erro na limpeza de auditoria', 'error', err.message)
  }
})
