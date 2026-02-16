import { useState } from 'react';
import { Avatar } from './Avatar';

interface CommentsSectionProps {
  comment: string;
  setComment: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface Comment {
  id: number;
  name: string;
  content: string;
  time: string;
}

const initialComments: Comment[] = [
  { id: 1, name: 'John Doe', content: 'Great intro! Looking forward to seeing more updates.', time: '2h' },
  { id: 2, name: 'Sarah Miller', content: 'Love the branding on this. The color scheme is perfect!', time: '5h' },
  { id: 3, name: 'Alex Kim', content: 'Can you share the timeline for the beta release?', time: '12h' },
];

export function CommentsSection({ comment, setComment, className, style }: CommentsSectionProps) {
  const [comments] = useState<Comment[]>(initialComments);

  return (
    <div className={`bg-white border border-neutral-200 rounded-2xl flex flex-col overflow-hidden ${className ?? ''}`} style={style}>
      <div className="px-4 py-3 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-neutral-500">Comments</h2>
          <span className="text-xs text-neutral-400">{comments.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((item) => (
          <div key={item.id} className="flex gap-3">
            <Avatar name={item.name} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                <span className="text-xs text-neutral-400">&middot; {item.time}</span>
              </div>
              <p className="text-sm text-neutral-600 mt-0.5">{item.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-neutral-200 shrink-0">
        <div className="flex gap-3 items-center">
          <Avatar name="Fayaz Ahmed" src='https://github.com/fayazara.png' />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors placeholder:text-neutral-400"
          />
        </div>
      </div>
    </div>
  );
}
