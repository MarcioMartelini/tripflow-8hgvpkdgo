cronAdd('audit_cleanup', '0 0 * * *', () => {
  try {
    const date90DaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const formattedDate = date90DaysAgo.toISOString().replace('T', ' ').substring(0, 19)

    const logs = $app.findRecordsByFilter(
      'logs_auditoria',
      `created < '${formattedDate}'`,
      '',
      10000,
      0,
    )
    for (let i = 0; i < logs.length; i++) {
      $app.delete(logs[i])
    }
  } catch (err) {
    $app.logger().error('Erro na limpeza de auditoria', 'error', err.message)
  }
})
