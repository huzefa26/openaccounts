import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm() {
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form className="flex flex-col gap-5">
      <Input
        label="Date"
        name="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <section className="border border-border rounded-md p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">From (credits)</h2>
        <p className="text-xs text-text-tertiary mb-3">Money out — decreases the account balance</p>
        <div className="text-sm text-text-tertiary">Rows will be added here.</div>
      </section>

      <section className="border border-border rounded-md p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">To (debits)</h2>
        <p className="text-xs text-text-tertiary mb-3">Money in — increases the account balance</p>
        <div className="text-sm text-text-tertiary">Rows will be added here.</div>
      </section>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-border-strong resize-none"
        />
      </div>

      <Button disabled title="Complete description and add entries to enable save">
        Save
      </Button>
    </form>
  );
}
