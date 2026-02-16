import { Flower, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CommentsSection, VideoInfo } from './components';

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

function App() {
  const [comment, setComment] = useState('');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const toggleTheater = () => setIsTheaterMode((v) => !v);

  // Extract video ID from URL: /share/:id
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/share\/([a-f0-9-]+)$/);

    if (!match) {
      setLoading(false);
      setError('no-video');
      return;
    }

    const videoId = match[1];

    fetch(`/api/videos/${videoId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Video not found');
        return res.json() as Promise<VideoData>;
      })
      .then((data) => {
        setVideo(data);
        setLoading(false);
      })
      .catch(() => {
        setError('not-found');
        setLoading(false);
      });
  }, []);

  // Landing page when no video ID is in the URL
  if (error === 'no-video') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Flower size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Bloom</h1>
            <p className="text-neutral-500 mt-2 max-w-md">
              An open-source screen recording tool. Record, share, and collaborate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error === 'not-found' || !video) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-xl font-semibold text-neutral-900">Video not found</h1>
            <p className="text-neutral-500 mt-2">This video may have been deleted or the link is invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  const videoUrl = video.streamUrl;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Full-width video in theater mode -- hidden on mobile */}
      {isTheaterMode && (
        <div className="hidden lg:block w-full bg-black" style={{ height: 'calc(100vh - 56px - 280px)' }}>
          <video src={videoUrl} controls className="block w-full h-full object-contain" />
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 px-0 lg:px-6 ${isTheaterMode ? 'lg:py-3' : 'lg:py-6'} py-0 overflow-auto`}>
        {isTheaterMode ? (
          /* Theater mode: single column stack */
          <div className="flex flex-col">
            <div className="lg:hidden w-full overflow-hidden bg-black">
              <video src={videoUrl} controls className="block w-full" />
            </div>
            <div className="px-4 lg:px-0 mt-3">
              <VideoInfo
                video={video}
                isTheaterMode={isTheaterMode}
                onToggleTheater={toggleTheater}
              />
            </div>
            <div className="px-4 lg:px-0 mt-4">
              <CommentsSection comment={comment} setComment={setComment} />
            </div>
          </div>
        ) : (
          /* Default mode: grid layout -- video + info in col 1, comments in col 2 */
          <div className="flex flex-col lg:grid lg:gap-6" style={{ gridTemplateColumns: '1fr 400px' }}>
            {/* Video -- col 1, row 1 */}
            <div ref={videoRef} className="w-full overflow-hidden bg-black rounded-none lg:rounded-2xl" style={{ gridColumn: 1, gridRow: 1 }}>
              <video src={videoUrl} controls className="block w-full" />
            </div>

            {/* Comments -- col 2, row 1 only (same height as video) */}
            <div className="px-4 lg:px-0 mt-4 lg:mt-0 order-2 lg:order-0" style={{ gridColumn: 2, gridRow: 1 }}>
              <CommentsSection comment={comment} setComment={setComment} className="h-full" />
            </div>

            {/* Video Info -- col 1, row 2 */}
            <div className="px-4 lg:px-0 mt-3 order-1 lg:order-0" style={{ gridColumn: 1, gridRow: 2 }}>
              <VideoInfo
                video={video}
                isTheaterMode={isTheaterMode}
                onToggleTheater={toggleTheater}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center px-4 h-14 bg-white border-b border-neutral-200">
      <a href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <Flower size={20} className="text-white" />
        </div>
        <span className="text-lg font-semibold text-neutral-900">Bloom</span>
      </a>
    </header>
  );
}

export default App;
