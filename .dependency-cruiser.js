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
    exclude: '(^apps/app/android|^apps/app/dist|node_modules)',
    doNotFollow: {
      path: '(^apps/app/android|^apps/app/dist|node_modules)'
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' }
  }
};
