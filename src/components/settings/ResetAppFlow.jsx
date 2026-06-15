import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const STEPS = [
  {
    title: 'Reset App',
    message: 'This will permanently delete all your data, including transactions, categories, currencies, settings, and your Google Drive backup. This cannot be undone.',
    confirmLabel: 'Continue',
  },
  {
    title: 'Confirm Reset',
    message: <>Type <strong>delete</strong> below to confirm.</>,
    placeholder: 'delete',
    confirmLabel: 'Confirm',
    requireMatch: 'delete',
  },
  {
    title: 'Final Confirmation',
    message: <>Type <strong>i am sure</strong> to proceed.</>,
    placeholder: 'i am sure',
    confirmLabel: 'Reset App',
    requireMatch: 'i am sure',
  },
];

export default function ResetAppFlow({ onReset, onClose }) {
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState('');

  function handleCancel() {
    setResetStep(0);
    setResetInput('');
    onClose();
  }

  function handleConfirm() {
    if (resetStep < STEPS.length - 1) {
      setResetStep((s) => s + 1);
      setResetInput('');
    } else {
      setResetStep('deleting');
      onReset();
    }
  }

  if (resetStep === 'deleting') {
    return (
      <Modal open onClose={() => {}} title="Resetting App">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Resetting data...</p>
        </div>
      </Modal>
    );
  }

  const step = STEPS[resetStep];

  return (
    <Modal open onClose={handleCancel} title={step.title}>
      <p className="text-sm text-text-primary mb-4">{step.message}</p>
      {step.placeholder && (
        <input
          type="text"
          value={resetInput}
          onChange={(e) => setResetInput(e.target.value)}
          placeholder={step.placeholder}
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-accent focus:border-accent mb-4"
        />
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
        <Button
          variant="danger"
          disabled={step.requireMatch ? resetInput !== step.requireMatch : false}
          onClick={handleConfirm}
        >
          {step.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
