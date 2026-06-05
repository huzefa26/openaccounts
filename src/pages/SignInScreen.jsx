import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';

export default function SignInScreen() {
  const { signIn, loading, error, clearError } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-3">
            OpenAccounts
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Track your accounts with OpenAccounts.
            <br />
            Sign in to get started and access your data.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-expense-bg border border-expense rounded-md">
            <p className="text-sm text-expense">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => { clearError(); signIn(); }}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    </div>
  );
}
