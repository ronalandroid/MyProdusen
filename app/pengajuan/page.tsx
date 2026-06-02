import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Pengajuan | MyProdusen',
  description: 'Redirect ke halaman pengajuan cuti MyProdusen.',
};

export default function PengajuanRedirectPage() {
  return redirect('/dashboard/leave');
}
