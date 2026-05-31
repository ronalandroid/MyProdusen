import { leaderboard } from '@/lib/gamification/api';
export function GET(request: Request) { return leaderboard(request as any, true); }
