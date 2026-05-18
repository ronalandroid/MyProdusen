"use client";

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION' | 'EMPTY';

interface HeatmapProps {
  employeeId?: string; // If undefined, fetches current user's heatmap
}

export default function AttendanceHeatmap({ employeeId }: HeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoading(true);
        const url = employeeId 
          ? `/api/dashboard/heatmap?employeeId=${employeeId}` 
          : '/api/dashboard/heatmap';
          
        const res = await fetch(url, { headers: getAuthHeaders() });
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch heatmap data');
        }
        
        setHeatmapData(json.data.heatmap);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [employeeId]);

  // Generate last 365 days
  const today = new Date();
  const days = Array.from({ length: 365 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (364 - i));
    return date.toISOString().slice(0, 10);
  });

  const getColorClass = (status?: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-[var(--success)] border-[var(--success)]';
      case 'LATE': return 'bg-[var(--warning)] border-[var(--warning)]';
      case 'ABSENT': return 'bg-[var(--danger)] border-[var(--danger)]';
      case 'LEAVE':
      case 'SICK': 
      case 'PERMISSION': return 'bg-[var(--info)] border-[var(--info)]';
      default: return 'bg-[var(--bg-secondary)] border-[var(--border-color)] opacity-50';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PRESENT': return 'Tepat waktu';
      case 'LATE': return 'Terlambat';
      case 'ABSENT': return 'Alpha';
      case 'LEAVE': return 'Cuti';
      case 'SICK': return 'Sakit';
      case 'PERMISSION': return 'Izin';
      default: return 'Tidak ada data';
    }
  };

  if (loading) {
    return (
      <div className="card p-6 flex justify-center items-center h-[200px]">
        <LoadingSpinner size="md" message="Memuat heatmap..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-red-500 bg-red-500/10 text-red-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // To display correctly in a grid, we normally want 7 rows (Sun-Sat) and 52 columns.
  // For simplicity and exact GitHub style, we can map them.
  // We'll calculate the day of week of the oldest date to offset the grid correctly.
  const startDate = new Date(days[0]);
  const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const emptyOffset = Array.from({ length: startDayOfWeek }, () => null);

  return (
    <div className="card p-6 bg-[var(--bg-card)]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        Aktivitas Kehadiran (365 Hari Terakhir)
      </h3>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
          {emptyOffset.map((_, i) => (
            <div key={`empty-${i}`} className="w-3 h-3 opacity-0" /> // Hidden blocks for alignment
          ))}
          
          {days.map((date) => {
            const status = heatmapData[date];
            return (
              <button
                type="button"
                key={date}
                title={`${date} - ${getStatusLabel(status)}`}
                aria-label={`${date}: ${getStatusLabel(status)}`}
                className={`w-3.5 h-3.5 rounded-sm border cursor-help transition-all hover:ring-2 hover:ring-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] ${getColorClass(status)}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-secondary)] flex-wrap">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] opacity-50" /> Kosong</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--success)]" /> Tepat Waktu</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--warning)]" /> Terlambat</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--info)]" /> Cuti/Izin</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[var(--danger)]" /> Alpha</span>
      </div>
    </div>
  );
}
