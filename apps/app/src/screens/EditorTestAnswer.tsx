import { useState, useId } from 'react';
import { registry } from '@formulaflash/core';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

interface EditorTestAnswerProps {
  cardId: string;
  expectedAnswer: string;
  mode: 'text' | 'math' | 'mixed';
  acceptedAlternates: string[];
}

export function EditorTestAnswer({
  cardId,
  expectedAnswer,
  mode,
  acceptedAlternates,
}: EditorTestAnswerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [result, setResult] = useState<{ correct: boolean; message?: string } | null>(null);
  const testInputId = useId();

  const handleTest = () => {
    if (!testInput.trim()) {
      setResult(null);
      return;
    }

    const checker = registry.getChecker(mode === 'math' ? 'math' : 'text');
    const allExpected = [expectedAnswer, ...acceptedAlternates].filter(Boolean);

    let passed = false;
    let feedback = 'Incorrect';

    for (const exp of allExpected) {
      const verdict = checker.check(testInput, exp);
      if (verdict.correct) {
        passed = true;
        feedback = `Accepted via ${verdict.via}${verdict.message ? `: ${verdict.message}` : ''}`;
        break;
      }
    }

    setResult({
      correct: passed,
      message: feedback,
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="editor-test-btn"
        data-testid={`editor-test-open-${cardId}`}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="sparkles" size="sm" />
        <span>Test this answer</span>
      </button>
    );
  }

  return (
    <div className="editor-test-box" data-testid={`editor-test-box-${cardId}`}>
      <div className="editor-test-header">
        <span className="editor-test-title">
          <Icon name="sparkles" size="sm" /> Live Answer Checker
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setTestInput('');
            setResult(null);
          }}
        >
          Close
        </Button>
      </div>

      <div className="editor-test-input-row">
        <label htmlFor={testInputId} className="hidden">Test alternative answer</label>
        <input
          id={testInputId}
          type="text"
          className="editor-test-input"
          data-testid={`editor-test-input-${cardId}`}
          placeholder="Type alternate phrasing or LaTeX to verify..."
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleTest();
            }
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          data-testid={`editor-test-run-${cardId}`}
          onClick={handleTest}
        >
          Check
        </Button>
      </div>

      {result && (
        <div
          className={`editor-test-result ${result.correct ? 'is-correct' : 'is-incorrect'}`}
          data-testid={`editor-test-result-${cardId}`}
        >
          <Icon name={result.correct ? 'check' : 'x'} size="sm" />
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
