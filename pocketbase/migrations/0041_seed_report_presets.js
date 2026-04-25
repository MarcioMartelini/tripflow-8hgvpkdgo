migrate(
  (app) => {
    const configs = app.findCollectionByNameOrId('configuracoes_sistema')

    const presets = [
      {
        chave: 'preset_compacto',
        valor: JSON.stringify({
          margin_top: 10,
          margin_bottom: 10,
          margin_left: 10,
          margin_right: 10,
          font_size: 'text-xs',
          show_charts: false,
          show_notes: false,
          show_alerts: false,
          page_break: false,
          name: 'Compacto',
        }),
        descricao: 'Configuração do preset Compacto',
      },
      {
        chave: 'preset_executivo',
        valor: JSON.stringify({
          margin_top: 25,
          margin_bottom: 25,
          margin_left: 25,
          margin_right: 25,
          font_size: 'text-base',
          show_charts: true,
          show_notes: false,
          show_alerts: true,
          page_break: true,
          name: 'Executivo',
        }),
        descricao: 'Configuração do preset Executivo',
      },
      {
        chave: 'preset_detalhado',
        valor: JSON.stringify({
          margin_top: 20,
          margin_bottom: 20,
          margin_left: 20,
          margin_right: 20,
          font_size: 'text-sm',
          show_charts: true,
          show_notes: true,
          show_alerts: true,
          page_break: false,
          name: 'Detalhado',
        }),
        descricao: 'Configuração do preset Detalhado',
      },
      {
        chave: 'active_report_preset',
        valor: 'preset_detalhado',
        descricao: 'Preset ativo do relatorio',
      },
    ]

    for (const p of presets) {
      try {
        app.findFirstRecordByData('configuracoes_sistema', 'chave', p.chave)
      } catch (_) {
        const record = new Record(configs)
        record.set('chave', p.chave)
        record.set('valor', p.valor)
        record.set('descricao', p.descricao)
        app.save(record)
      }
    }
  },
  (app) => {
    // empty since this is seed data
  },
)
