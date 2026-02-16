import { Download, Share2, MoreHorizontal, ThumbsUp, Eye, Maximize, Minimize } from 'lucide-react';
import { Avatar } from './Avatar';

interface VideoData {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  duration: number | null;
  contentType: string;
  createdAt: string;
  streamUrl: string;
}

interface VideoInfoProps {
  video: VideoData;
  isTheaterMode: boolean;
  onToggleTheater: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + 'Z'); // D1 stores UTC without Z
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoInfo({ video, isTheaterMode, onToggleTheater }: VideoInfoProps) {
  const timeAgo = formatTimeAgo(video.createdAt);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback: do nothing
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = video.streamUrl;
    a.download = video.filename;
    a.click();
  };

  return (
    <div className="flex flex-col">
      {/* Title */}
      <h1 className="text-lg lg:text-xl font-semibold text-neutral-900 order-1">
        {video.title}
      </h1>

      {/* Author + Actions row */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-3 order-2">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar name="Bloom User" size={40} />
          <div>
            <p className="text-sm font-medium text-neutral-900">Shared via Bloom</p>
            <p className="text-xs text-neutral-500">{timeAgo}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="flex items-center bg-neutral-200/70 rounded-full overflow-hidden">
            <button className="flex items-center gap-1.5 px-3 lg:px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-300/70 transition-colors">
              <ThumbsUp size={16} />
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 lg:px-4 py-2 text-sm font-medium text-neutral-800 bg-neutral-200/70 hover:bg-neutral-300/70 rounded-full transition-colors"
          >
            <Share2 size={16} />
            <span className="hidden lg:inline">Share</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 lg:px-4 py-2 text-sm font-medium text-neutral-800 bg-neutral-200/70 hover:bg-neutral-300/70 rounded-full transition-colors"
          >
            <Download size={16} />
            <span className="hidden lg:inline">Download</span>
          </button>
          <button
            onClick={onToggleTheater}
            className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-800 bg-neutral-200/70 hover:bg-neutral-300/70 rounded-full transition-colors"
            title={isTheaterMode ? 'Default view' : 'Theater mode'}
          >
            {isTheaterMode ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button className="p-2 text-neutral-600 hover:bg-neutral-200/70 rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 p-3 bg-neutral-200/50 rounded-2xl order-3">
        <div className="flex items-center gap-3 text-sm font-medium text-neutral-900">
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {formatFileSize(video.fileSize)}
          </span>
          {video.duration && (
            <span>{formatDuration(video.duration)}</span>
          )}
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
