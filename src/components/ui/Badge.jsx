import { getDotColor } from '../../constants/accountColors';

export default function Badge({ type, className = '' }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${getDotColor(type)} ${className}`}
      aria-hidden="true"
    />
  );
}
