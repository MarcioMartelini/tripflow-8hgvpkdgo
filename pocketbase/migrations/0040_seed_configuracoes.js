migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_sistema')
    const configs = [
      {
        chave: 'relatorio_mostrar_logo',
        valor: 'false',
        descricao: 'Mostrar logo no relatório (Oculto por padrão conforme regra do negócio)',
      },
      {
        chave: 'relatorio_mostrar_grafico',
        valor: 'true',
        descricao: 'Mostrar gráfico de orçamento no relatório',
      },
      {
        chave: 'relatorio_mostrar_alerta',
        valor: 'true',
        descricao: 'Mostrar alerta de gastos no relatório',
      },
      {
        chave: 'relatorio_mostrar_descricao',
        valor: 'true',
        descricao: 'Mostrar descrição da viagem no relatório',
      },
      { chave: 'app_nome', valor: 'TripFlow', descricao: 'Nome global da aplicação' },
      { chave: 'email_suporte', valor: 'suporte@tripflow.com', descricao: 'Email de suporte' },
      { chave: 'modo_manutencao', valor: 'false', descricao: 'Modo de manutenção ativo' },
      { chave: 'feature_offline_sync', valor: 'true', descricao: 'Ativar sincronização offline' },
      {
        chave: 'raw_json_config',
        valor: '{\n  "theme": "light",\n  "debugMode": false\n}',
        descricao: 'Configurações avançadas em JSON',
      },
    ]

    for (let i = 0; i < configs.length; i++) {
      const conf = configs[i]
      try {
        app.findFirstRecordByData('configuracoes_sistema', 'chave', conf.chave)
      } catch (_) {
        const record = new Record(col)
        record.set('chave', conf.chave)
        record.set('valor', conf.valor)
        record.set('descricao', conf.descricao)
        app.save(record)
      }
    }
  },
  (app) => {
    const chaves = [
      'relatorio_mostrar_logo',
      'relatorio_mostrar_grafico',
      'relatorio_mostrar_alerta',
      'relatorio_mostrar_descricao',
      'app_nome',
      'email_suporte',
      'modo_manutencao',
      'feature_offline_sync',
      'raw_json_config',
    ]

    for (let i = 0; i < chaves.length; i++) {
      try {
        const record = app.findFirstRecordByData('configuracoes_sistema', 'chave', chaves[i])
        app.delete(record)
      } catch (_) {}
    }
  },
)
