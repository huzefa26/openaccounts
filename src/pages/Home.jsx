import TransactionForm from '../components/forms/TransactionForm';

export default function Home() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Home</h1>
      <TransactionForm />
    </div>
  );
}
