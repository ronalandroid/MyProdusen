import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
      style={{ background: 'var(--surface-warm)' }}
    >
      <div className="card w-full max-w-md p-8">
        <Image
          src="/logo-fast.webp"
          width={64}
          height={64}
          alt="MyProdusen"
          className="mx-auto h-16 w-16 object-contain"
          priority
        />
        <p className="mt-6 text-6xl font-black leading-none" style={{ color: 'var(--primary-dark)' }}>
          404
        </p>
        <h1 className="mt-3 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Halaman yang Anda cari mungkin sudah dipindahkan, berganti nama, atau tidak tersedia.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="btn btn-primary">
            Kembali ke Dashboard
          </Link>
          <Link href="/" className="btn btn-secondary">
            Halaman Utama
          </Link>
        </div>
      </div>
    </main>
  );
}
