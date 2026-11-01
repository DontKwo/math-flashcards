module.exports = {
  forbidden: [
    {
      name: 'core-must-not-depend-on-apps',
      severity: 'error',
      from: { path: '^packages/core' },
      to: { path: '^apps/' }
    },
    {
      name: 'core-must-not-depend-on-react-or-dom',
      severity: 'error',
      from: { path: '^packages/core' },
      to: { path: '^(react|react-dom|@capacitor)' }
    }
  ],
  options: {
    tsPreCompilationDeps: true,
    exclude: ['^apps/app/android', '^apps/app/dist', '^node_modules'],
    tsConfig: { fileName: 'tsconfig.json' }
  }
};
