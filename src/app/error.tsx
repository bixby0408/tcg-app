"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-2">오류 발생</h1>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-gray-100 rounded-lg p-4 overflow-auto mb-4 text-gray-700">
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
