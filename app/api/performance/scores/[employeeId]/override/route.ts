import { NextRequest } from 'next/server';
import { overrideScore } from '@/lib/gamification/api';
export async function POST(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) { return overrideScore(request, (await params).employeeId); }
