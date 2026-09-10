type Props = {
  message: string;
  detail?: string;
  className?: string;
};

export function FriendlyErrorAlert({ message, detail, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}
      role="alert"
    >
      <p className="font-medium">{message}</p>
      {detail && detail !== message ? (
        <p className="mt-1 break-words text-xs text-red-600/80">{detail}</p>
      ) : null}
    </div>
  );
}
