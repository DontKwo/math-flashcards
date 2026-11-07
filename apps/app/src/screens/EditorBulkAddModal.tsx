import { useState, useId } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { SegmentedControl } from '../ui/SegmentedControl.tsx';

interface EditorBulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: Array<{ frontText: string; answerText: string }>) => void;
}

export function EditorBulkAddModal({
  isOpen,
  onClose,
  onImport,
}: EditorBulkAddModalProps) {
  const [rawText, setRawText] = useState('');
  const [delimiterType, setDelimiterType] = useState<'tab' | 'comma' | 'newline' | 'custom'>('tab');
  const [customDelimiter, setCustomDelimiter] = useState(' - ');
  const customDelimId = useId();

  const delimiterOptions = [
    { label: 'Tab', value: 'tab' },
    { label: 'Comma', value: 'comma' },
    { label: 'Newline (Front / Back)', value: 'newline' },
    { label: 'Custom', value: 'custom' },
  ];

  const parsedCards: Array<{ frontText: string; answerText: string }> = [];

  if (delimiterType === 'newline') {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        parsedCards.push({ frontText: lines[i], answerText: lines[i + 1] });
      }
    }
  } else {
    const delim =
      delimiterType === 'tab'
        ? '\t'
        : delimiterType === 'comma'
        ? ','
        : customDelimiter;

    const lines = rawText.split('\n');
    lines.forEach((line) => {
      const parts = line.split(delim);
      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts.slice(1).join(delim).trim();
        if (front || back) {
          parsedCards.push({ frontText: front, answerText: back });
        }
      }
    });
  }

  const handleConfirm = () => {
    if (parsedCards.length === 0) return;
    onImport(parsedCards);
    setRawText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Add Cards"
      data-testid="editor-bulk-modal"
    >
      <div className="editor-bulk-container">
        <p className="editor-bulk-desc">
          Paste your cards below. Choose the separator between term and answer.
        </p>

        <div className="editor-bulk-controls">
          <SegmentedControl
            options={delimiterOptions}
            value={delimiterType}
            onChange={(val) => setDelimiterType(val as 'tab' | 'comma' | 'newline' | 'custom')}
          />
          {delimiterType === 'custom' && (
            <div className="editor-custom-delim-row">
              <label htmlFor={customDelimId} className="editor-sublabel">Custom separator:</label>
              <input
                id={customDelimId}
                type="text"
                className="editor-subinput"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
              />
            </div>
          )}
        </div>

        <textarea
          className="editor-bulk-textarea"
          rows={7}
          data-testid="editor-bulk-textarea"
          placeholder="Term 1&#9;Answer 1&#10;Term 2&#9;Answer 2"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />

        {parsedCards.length > 0 && (
          <div className="editor-bulk-preview">
            <span className="editor-sublabel">
              Preview ({parsedCards.length} cards detected)
            </span>
            <div className="editor-bulk-table-wrap">
              <table className="editor-bulk-table" data-testid="editor-bulk-preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Term / Front</th>
                    <th>Answer / Back</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedCards.slice(0, 10).map((c, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{c.frontText}</td>
                      <td>{c.answerText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedCards.length > 10 && (
              <p className="editor-bulk-more">
                ...and {parsedCards.length - 10} more cards
              </p>
            )}
          </div>
        )}

        <div className="editor-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={parsedCards.length === 0}
            data-testid="editor-bulk-import-btn"
            onClick={handleConfirm}
          >
            Import {parsedCards.length} Cards
          </Button>
        </div>
      </div>
    </Modal>
  );
}
