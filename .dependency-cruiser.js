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
      to: { module: '^(react|react-dom|@capacitor)' }
    }
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' }
  }
};
