'use client';

import { type FormEvent, useEffect, useReducer } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

interface AnnouncementDetail {
  announcement: {
    id: string;
    title: string;
    content: string;
    category: string;
    priority: string;
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
  comments: Array<{
    comment: {
      id: string;
      comment: string;
      createdAt: string;
    };
    user: {
      id: string;
      username: string;
    };
    employee: {
      fullName: string;
      profilePhoto: string | null;
    };
  }>;
}

interface State {
  announcement: AnnouncementDetail | null;
  loading: boolean;
  comment: string;
  submitting: boolean;
  feedback: string | null;
}

type Action =
  | { type: 'loaded'; announcement: AnnouncementDetail | null }
  | { type: 'loadFailed' }
  | { type: 'setComment'; comment: string }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
  | { type: 'submitError'; feedback: string }
  | { type: 'submitEnd' };

const initialState: State = {
  announcement: null,
  loading: true,
  comment: '',
  submitting: false,
  feedback: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return { ...state, announcement: action.announcement, loading: false };
    case 'loadFailed':
      return { ...state, loading: false };
    case 'setComment':
      return { ...state, comment: action.comment };
    case 'submitStart':
      return { ...state, submitting: true };
    case 'submitSuccess':
      return { ...state, comment: '', feedback: 'Komentar berhasil dikirim.' };
    case 'submitError':
      return { ...state, feedback: action.feedback };
    case 'submitEnd':
      return { ...state, submitting: false };
    default:
      return state;
  }
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(dateString: string) {
  return dateFormatter.format(new Date(dateString));
}

const CATEGORY_STYLES: Record<string, string> = {
  GENERAL: 'bg-blue-100 text-blue-800',
  POLICY: 'bg-purple-100 text-purple-800',
  EVENT: 'bg-green-100 text-green-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

const PRIORITY_STYLES: Record<string, string> = {
  NORMAL: 'bg-gray-100 text-gray-800',
  IMPORTANT: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

function Badge({ label, styles }: { label: string; styles: Record<string, string> }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[label] ?? 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [state, dispatch] = useReducer(reducer, initialState);
  const { announcement, loading, comment, submitting, feedback } = state;

  useEffect(() => {
    let active = true;

    async function fetchAnnouncement() {
      if (!id) {
        dispatch({ type: 'loadFailed' });
        return;
      }

      try {
        const res = await fetch(`/api/announcements/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!active) return;
        dispatch({ type: 'loaded', announcement: res.ok ? data.data : null });
      } catch (error) {
        console.error('Error fetching announcement:', error);
        if (active) dispatch({ type: 'loadFailed' });
      }
    }

    fetchAnnouncement();

    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !comment.trim()) return;

    dispatch({ type: 'submitStart' });
    try {
      const announcementUrl = `/api/announcements/${encodeURIComponent(id)}`;
      const res = await fetch(`${announcementUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      if (res.ok) {
        dispatch({ type: 'submitSuccess' });
        const refresh = await fetch(announcementUrl);
        const data = await refresh.json();
        dispatch({ type: 'loaded', announcement: refresh.ok ? data.data : null });
      } else {
        const error = await res.json();
        dispatch({
          type: 'submitError',
          feedback: typeof error.error === 'string' ? error.error : 'Komentar gagal dikirim.',
        });
      }
    } catch {
      dispatch({ type: 'submitError', feedback: 'Gagal mengirim komentar. Coba lagi sebentar.' });
    } finally {
      dispatch({ type: 'submitEnd' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full size-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Announcement tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {feedback && (
        <output className="mb-4 block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {feedback}
        </output>
      )}
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="size-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      {/* Announcement Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {announcement.employee?.profilePhoto ? (
                <Image
                  src={announcement.employee.profilePhoto}
                  alt={announcement.employee.fullName}
                  width={64}
                  height={64}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xl">
                    {announcement.employee?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {announcement.announcement.isPinned && (
                  <svg className="size-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-5-3-5 3V5z" />
                  </svg>
                )}
                <h1 className="text-2xl font-semibold text-gray-900">
                  {announcement.announcement.title}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">
                  {announcement.employee?.fullName || announcement.publisher.username}
                </span>
                <span>•</span>
                <span>{formatDate(announcement.announcement.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge label={announcement.announcement.category} styles={CATEGORY_STYLES} />
                <Badge label={announcement.announcement.priority} styles={PRIORITY_STYLES} />
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        {announcement.announcement.imageUrl && (
          <div className="w-full">
            <Image
              src={announcement.announcement.imageUrl}
              alt={announcement.announcement.title}
              width={1024}
              height={384}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {announcement.announcement.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span className="text-sm font-medium">Suka</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium">Bagikan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Komentar ({announcement.comments.length})
        </h2>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <label htmlFor="comment" className="sr-only">
            Tulis komentar
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => dispatch({ type: 'setComment', comment: e.target.value })}
            placeholder="Tulis komentar..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!comment.trim() || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {announcement.comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada komentar. Jadilah yang pertama berkomentar!
            </p>
          ) : (
            announcement.comments.map((item) => (
              <div key={item.comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {item.employee?.profilePhoto ? (
                    <Image
                      src={item.employee.profilePhoto}
                      alt={item.employee.fullName}
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {item.employee?.fullName?.charAt(0) || item.user.username.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {item.employee?.fullName || item.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{item.comment.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
