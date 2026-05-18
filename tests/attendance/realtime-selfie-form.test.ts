import { describe, expect, it } from 'vitest';
import { parseCheckInRealtimeForm } from '@/lib/attendance/realtime-selfie-form';

function requestFromForm(formData: FormData) {
  return new Request('https://myprodusen.test/api/attendance/check-in', { method: 'POST', body: formData });
}

describe('realtime selfie attendance form parsing', () => {
  it('rejects check-in without realtime selfie file', async () => {
    const form = new FormData();
    form.set('workLocationId', 'loc_1');
    form.set('latitude', '3.5952');
    form.set('longitude', '98.6722');
    form.set('accuracy', '10');

    await expect(parseCheckInRealtimeForm(requestFromForm(form))).rejects.toThrow('Selfie realtime wajib diambil');
  });

  it('rejects check-in without GPS latitude and longitude', async () => {
    const form = new FormData();
    form.set('workLocationId', 'loc_1');
    form.set('accuracy', '10');
    form.set('selfie', new File(['x'], 'selfie.jpg', { type: 'image/jpeg' }));

    await expect(parseCheckInRealtimeForm(requestFromForm(form))).rejects.toThrow();
  });
});
