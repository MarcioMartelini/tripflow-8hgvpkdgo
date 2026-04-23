migrate(
  (app) => {
    // Limpar documentos antigos que não possuem o arquivo obrigatório
    app.db().newQuery('DELETE FROM documentos').execute()

    const col = app.findCollectionByNameOrId('documentos')

    if (!col.fields.getByName('arquivo')) {
      col.fields.add(
        new FileField({
          name: 'arquivo',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    if (!col.fields.getByName('notas')) {
      col.fields.add(
        new TextField({
          name: 'notas',
        }),
      )
    }

    // Regras de segurança para restringir ao dono (usuario_id)
    const rule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    col.listRule = rule
    col.viewRule = rule
    col.createRule = rule
    col.updateRule = rule
    col.deleteRule = rule

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')

    if (col.fields.getByName('arquivo')) {
      col.fields.removeByName('arquivo')
    }
    if (col.fields.getByName('notas')) {
      col.fields.removeByName('notas')
    }

    const oldRule = "@request.auth.id != ''"
    col.listRule = oldRule
    col.viewRule = oldRule
    col.createRule = oldRule
    col.updateRule = oldRule
    col.deleteRule = oldRule

    app.save(col)
  },
)
