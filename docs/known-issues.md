# Known Issues & Edge Cases

The following edge cases were evaluated by the exhaustive testing harness and documented for future optimization:

1. **Very Long Mathematical Expressions (>10k characters)**
   - **Diagnosis:** Inputting 10,000+ characters into the MathLive field triggers heavy AST canonicalization inside `@cortex-js/compute-engine`. While safe from catastrophic regex backtracking, AST parsing takes >1s on low-power devices.
   - **Status:** Mitigated with input bounds checks and timeout limits in `MathChecker`.

2. **European Comma Separators in LaTeX Environments**
   - **Diagnosis:** Inputs such as `1,5` in standard LaTeX math modes are parsed as coordinates/lists rather than decimals unless wrapped in `{}` or handled by locale decimal rules.
   - **Status:** Handled via numeric checker preprocessing, power users recommended to use standard dot notation in formulas.
