import { Alert } from '../ui/Alert';

export function ConfigErrorScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Alert tone="danger">
          <p className="font-medium">Alamat API belum diatur</p>
          <p>
            Isi variabel <code className="font-mono">VITE_API_URL</code> dengan alamat server Laravel (mis.
            http://localhost:8000), lalu jalankan ulang <code className="font-mono">npm run dev</code>. Lihat docs/SETUP.md.
          </p>
        </Alert>
      </div>
    </main>
  );
}
