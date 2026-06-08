'use client';

import { useId, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApiData } from '@/hooks/useDashboardQueries';

interface Announcement {
  announcement: {
    id: string;
    title: string;
    content: string;
    category: 'GENERAL' | 'POLICY' | 'EVENT' | 'EMERGENCY';
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
    isPinned: boolean;
    publishedAt: string;
    imageUrl: string | null;
  };
  publisher: {
    id: string;
    username: string;
  };
  employee: {
    fullName: string;
    profilePhoto: string | null;
  };
  isRead: boolean;
}

interface FormData {
  title: string;
  content: string;
  category: 'GENERAL' | 'POLICY' | 'EVENT' | 'EMERGENCY';
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  targetAudience: string;
  imageUrl: string;
}

interface State {
  filter: string;
  showCreateModal: boolean;
  feedback: string | null;
  formData: FormData;
}

const INITIAL_FORM: FormData = {
  title: '',
  content: '',
  category: 'GENERAL',
  priority: 'NORMAL',
  targetAudience: 'ALL',
  imageUrl: '',
};

const initialState: State = {
  filter: 'ALL',
  showCreateModal: false,
  feedback: null,
  formData: INITIAL_FORM,
};

type Action =
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_SHOW_CREATE_MODAL'; payload: boolean }
  | { type: 'SET_FEEDBACK'; payload: string | null }
  | { type: 'PATCH_FORM'; payload: Partial<FormData> }
  | { type: 'RESET_FORM' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SHOW_CREATE_MODAL':
      return { ...state, showCreateModal: action.payload };
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'PATCH_FORM':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'RESET_FORM':
      return { ...state, formData: INITIAL_FORM };
    default:
      return state;
  }
}

// --- Module-scope pure helpers (no local state, never rebuilt per render) ---

function getCategoryBadge(category: string) {
  const styles = {
    GENERAL: 'bg-blue-100 text-blue-800',
    POLICY: 'bg-purple-100 text-purple-800',
    EVENT: 'bg-green-100 text-green-800',
    EMERGENCY: 'bg-red-100 text-red-800',
  };

  const icons = {
    GENERAL: '📢',
    POLICY: '📋',
    EVENT: '🎉',
    EMERGENCY: '🚨',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        styles[category as keyof typeof styles]
      }`}
    >
      <span>{icons[category as keyof typeof icons]}</span>
      {category}
    </span>
  );
}

function getPriorityBadge(priority: string) {
  const styles = {
    NORMAL: 'bg-gray-100 text-gray-800',
    IMPORTANT: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[priority as keyof typeof styles]
      }`}
    >
      {priority}
    </span>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// --- Subcomponents (split from the giant component) ---

function AnnouncementsHeader({
  feedback,
  onCreate,
}: {
  feedback: string | null;
  onCreate: () => void;
}) {
  return (
    <div className="mb-8">
      {feedback && (
        <output className="mb-4 block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {feedback}
        </output>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Berita dan pengumuman perusahaan</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Announcement
        </button>
      </div>
    </div>
  );
}

const FILTERS = ['ALL', 'GENERAL', 'POLICY', 'EVENT', 'EMERGENCY'] as const;

function FilterTabs({
  filter,
  onChange,
}: {
  filter: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {FILTERS.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === category
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {category === 'ALL' ? 'Semua' : category}
        </button>
      ))}
    </div>
  );
}

function StatsCards({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{announcements.length}</p>
          </div>
          <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="size-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Unread</p>
            <p className="text-2xl font-semibold text-orange-600 mt-1">
              {announcements.filter((a) => !a.isRead).length}
            </p>
          </div>
          <div className="size-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="size-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pinned</p>
            <p className="text-2xl font-semibold text-purple-600 mt-1">
              {announcements.filter((a) => a.announcement.isPinned).length}
            </p>
          </div>
          <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Urgent</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">
              {announcements.filter((a) => a.announcement.priority === 'URGENT').length}
            </p>
          </div>
          <div className="size-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="size-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
      <svg
        className="mx-auto size-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada announcement</h3>
      <p className="mt-1 text-sm text-gray-500">Mulai dengan membuat announcement baru</p>
    </div>
  );
}

function AnnouncementCard({
  item,
  onOpen,
}: {
  item: Announcement;
  onOpen: () => void;
}) {
  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
        !item.isRead ? 'border-blue-300 bg-blue-50' : 'border-gray-100'
      } ${item.announcement.isPinned ? 'ring-2 ring-purple-200' : ''}`}
    >
      {/* Full-card overlay button for keyboard + screen-reader accessible navigation */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Buka announcement: ${item.announcement.title}`}
        className="absolute inset-0 z-0 rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      <div className="relative z-10 flex items-start gap-4 pointer-events-none">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {item.employee?.profilePhoto ? (
            <Image
              src={item.employee.profilePhoto}
              alt={item.employee.fullName}
              width={48}
              height={48}
              unoptimized
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {item.employee?.fullName?.charAt(0) || 'A'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.announcement.isPinned && (
                  <svg className="size-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-5-3-5 3V5z" />
                  </svg>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{item.announcement.title}</h3>
                {!item.isRead && <span className="size-2 bg-blue-600 rounded-full"></span>}
              </div>
              <p className="text-sm text-gray-600">
                {item.employee?.fullName || item.publisher.username} • {formatDate(item.announcement.publishedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getCategoryBadge(item.announcement.category)}
              {getPriorityBadge(item.announcement.priority)}
            </div>
          </div>

          <p className="text-gray-700 line-clamp-2 mb-3">{item.announcement.content}</p>

          {item.announcement.imageUrl && (
            <Image
              src={item.announcement.imageUrl}
              alt={item.announcement.title}
              width={800}
              height={192}
              unoptimized
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <button type="button" className="relative z-10 pointer-events-auto flex items-center gap-1 hover:text-blue-600">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Komentar
            </button>
            <button type="button" className="relative z-10 pointer-events-auto flex items-center gap-1 hover:text-blue-600">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Bagikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateModal({
  formData,
  onPatch,
  onClose,
  onSubmit,
}: {
  formData: FormData;
  onPatch: (patch: Partial<FormData>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const titleId = useId();
  const contentId = useId();
  const categoryId = useId();
  const priorityId = useId();
  const imageUrlId = useId();

  return (
    <div className="fixed inset-0 bg-gray-950/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Announcement Baru</h3>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor={titleId} className="block text-sm font-medium text-gray-700 mb-2">
              Judul
            </label>
            <input
              id={titleId}
              type="text"
              value={formData.title}
              onChange={(e) => onPatch({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor={contentId} className="block text-sm font-medium text-gray-700 mb-2">
              Konten
            </label>
            <textarea
              id={contentId}
              value={formData.content}
              onChange={(e) => onPatch({ content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              required
              minLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor={categoryId} className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                id={categoryId}
                value={formData.category}
                onChange={(e) => onPatch({ category: e.target.value as FormData['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GENERAL">General</option>
                <option value="POLICY">Policy</option>
                <option value="EVENT">Event</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <div>
              <label htmlFor={priorityId} className="block text-sm font-medium text-gray-700 mb-2">
                Prioritas
              </label>
              <select
                id={priorityId}
                value={formData.priority}
                onChange={(e) => onPatch({ priority: e.target.value as FormData['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor={imageUrlId} className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              id={imageUrlId}
              type="url"
              value={formData.imageUrl}
              onChange={(e) => onPatch({ imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Publikasikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filter, showCreateModal, feedback, formData } = state;

  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['announcements', filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('category', filter);
      }
      return fetchApiData<Announcement[]>(`/api/announcements?${params}`, 'Announcement gagal dimuat.');
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const announcements = announcementsQuery.data ?? [];
  const loading = announcementsQuery.isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: false });
        dispatch({ type: 'RESET_FORM' });
        dispatch({ type: 'SET_FEEDBACK', payload: 'Announcement berhasil dibuat.' });
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
      } else {
        const error = await res.json();
        dispatch({
          type: 'SET_FEEDBACK',
          payload: typeof error.error === 'string' ? error.error : 'Announcement gagal dibuat.',
        });
      }
    } catch {
      dispatch({
        type: 'SET_FEEDBACK',
        payload: 'Gagal membuat announcement. Coba lagi sebentar.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full size-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AnnouncementsHeader
        feedback={feedback}
        onCreate={() => dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: true })}
      />

      <FilterTabs filter={filter} onChange={(value) => dispatch({ type: 'SET_FILTER', payload: value })} />

      <StatsCards announcements={announcements} />

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <EmptyState />
        ) : (
          announcements.map((item) => (
            <AnnouncementCard
              key={item.announcement.id}
              item={item}
              onOpen={() => router.push(`/dashboard/announcements/${item.announcement.id}`)}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateModal
          formData={formData}
          onPatch={(patch) => dispatch({ type: 'PATCH_FORM', payload: patch })}
          onClose={() => {
            dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: false });
            dispatch({ type: 'RESET_FORM' });
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
