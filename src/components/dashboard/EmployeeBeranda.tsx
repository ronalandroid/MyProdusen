"use client";

import type { Props } from "./employee/types";
import { useEmployeeBeranda } from "./employee/useEmployeeBeranda";
import { EmployeeHeader } from "./employee/EmployeeHeader";
import { MonthlyStatsStrip } from "./employee/MonthlyStatsStrip";
import { ShiftStatusBanner } from "./employee/ShiftStatusBanner";
import { PerformanceSection } from "./employee/PerformanceSection";
import { QuickActionsGrid } from "./employee/QuickActionsGrid";
import { PersonalSummaryCards } from "./employee/PersonalSummaryCards";
import { RecentActivityList } from "./employee/RecentActivityList";

export default function EmployeeBeranda({ profile }: Props) {
  const {
    workLocation, leaveBalance, notifications, loadError,
    perfScore, perfHistory, perfBadges, isPerfLoading, perfProgressState,
    showPerformanceDetail, setShowPerformanceDetail,
    gpsPosition, gpsError, isGettingGps, gpsDistanceMeters, isInsideRadius,
    monthCounts, displayName, initials, currentScoreOutOfTen, scoreTone,
    streakCalendar, currentStreak, onTimeDays, motivationCopy,
    todayRecord, shiftTimeText, hasCheckedIn, hasCheckedOut, greetingTitle, todayLabel,
  } = useEmployeeBeranda(profile);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <EmployeeHeader
        profile={profile}
        notifications={notifications}
        loadError={loadError}
        greetingTitle={greetingTitle}
        displayName={displayName}
        initials={initials}
      />

      <MonthlyStatsStrip hadir={monthCounts.hadir} currentStreak={currentStreak} currentScoreOutOfTen={currentScoreOutOfTen} />

      <ShiftStatusBanner
        profile={profile}
        workLocation={workLocation}
        todayLabel={todayLabel}
        shiftTimeText={shiftTimeText}
        hasCheckedIn={hasCheckedIn}
        hasCheckedOut={hasCheckedOut}
        isGettingGps={isGettingGps}
        gpsError={gpsError}
        gpsPosition={gpsPosition}
        gpsDistanceMeters={gpsDistanceMeters}
        isInsideRadius={isInsideRadius}
        todayRecord={todayRecord}
      />

      <PerformanceSection
        isPerfLoading={isPerfLoading}
        perfProgressState={perfProgressState}
        perfScore={perfScore}
        perfHistory={perfHistory}
        perfBadges={perfBadges}
        currentScoreOutOfTen={currentScoreOutOfTen}
        scoreTone={scoreTone}
        motivationCopy={motivationCopy}
        currentStreak={currentStreak}
        onTimeDays={onTimeDays}
        monthCountsHadir={monthCounts.hadir}
        monthCountsCuti={monthCounts.cuti}
        streakCalendar={streakCalendar}
        showPerformanceDetail={showPerformanceDetail}
        onToggleDetail={() => setShowPerformanceDetail((value) => !value)}
      />

      <QuickActionsGrid />

      <PersonalSummaryCards
        leaveBalance={leaveBalance}
        monthCountsHadir={monthCounts.hadir}
        monthCountsCuti={monthCounts.cuti}
        monthCountsSakit={monthCounts.sakit}
      />

      <RecentActivityList notifications={notifications} />
    </div>
  );
}
