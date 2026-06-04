// Hermes, değişken argümanlı dinamik `import()` ifadesini derleyemez
// ("Invalid expression encountered"). @supabase/supabase-js, isteğe bağlı
// OpenTelemetry için `import(OTEL_PKG)` (string literal DEĞİL) kullanıyor ve
// Metro bunu ham haliyle bundle'a bırakıyor -> Hermes bundle'ı reddediyor ->
// uygulama açılışta boş ekran. Bu özellik mobilde kullanılmadığından, sadece
// @supabase dosyalarında string-literal olmayan dinamik import'u no-op'a çeviriyoruz.
function neutralizeNonLiteralDynamicImport({ types: t }) {
  return {
    name: 'neutralize-nonliteral-dynamic-import',
    visitor: {
      CallExpression(path) {
        if (
          path.node.callee.type === 'Import' &&
          path.node.arguments.length > 0 &&
          !t.isStringLiteral(path.node.arguments[0])
        ) {
          // import(<değişken>) -> Promise.resolve(null)
          path.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
              [t.nullLiteral()]
            )
          );
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    overrides: [
      {
        test: /node_modules[\\/]@supabase[\\/]/,
        plugins: [neutralizeNonLiteralDynamicImport],
      },
    ],
  };
};
