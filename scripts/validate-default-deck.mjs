import { validateCfdDefaultDeck } from '../packages/core/dist/defaultSets/cfd/validate-script.js';

const report = validateCfdDefaultDeck();
console.log('\n========================================');
console.log('CFD DEFAULT DECK VALIDATION REPORT');
console.log('========================================');
console.log(`Total Cards: ${report.totalCards}\n`);
console.log('Cards per Category:');
console.table(report.categories);

if (report.errors.length > 0) {
  console.error(`\nValidation FAILED with ${report.errors.length} error(s):`);
  for (const err of report.errors.slice(0, 20)) {
    console.error(`- ${err}`);
  }
  process.exit(1);
} else {
  console.log('\nValidation PASSED successfully with 0 errors!\n');
}
