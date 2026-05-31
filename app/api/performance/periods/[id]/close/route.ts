import { NextRequest } from 'next/server';
import { closePeriod } from '@/lib/gamification/api';
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return closePeriod(request, (await params).id); }
