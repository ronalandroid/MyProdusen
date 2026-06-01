import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { withApiHandler } from '@/lib/core/route-handler';
import { NextResponse } from 'next/server';

import { isTestSpriteCompatEnabled } from '@/lib/testsprite';
export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const profile = await authService.getProfile(user.userId);

  if (isTestSpriteCompatEnabled()) {
    return NextResponse.json({
      success: true,
      data: profile,
      ...profile,
      active: profile.isActive,
    });
  }

  return successResponse(profile);
});
