export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vivo-logo.png" alt="NOVA" className="h-10 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-7">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
          {children}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Network Operations and Visibility Automation
        </p>
      </div>
    </div>
  );
}
