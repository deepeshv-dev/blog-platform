import { Link } from 'react-router-dom';

export function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default function PostCard({ post, featured = false }) {
  const excerpt = post.content.length > 190 ? `${post.content.slice(0, 190).trim()}…` : post.content;
  return (
    <article className={`post-card${featured ? ' featured-card' : ''}`}>
      <div className="card-meta"><span className="eyebrow">{post.category || 'Other'}</span><span>{formatDate(post.createdAt)}</span></div>
      <h2><Link to={`/posts/${post._id}`}>{post.title}</Link></h2>
      <p>{excerpt}</p>
      <div className="card-bottom"><span className="author-avatar">{post.author?.username?.slice(0, 1).toUpperCase() || 'W'}</span><span>By {post.author?.username || 'Writer'}</span><Link className="read-link" to={`/posts/${post._id}`}>Read story <span aria-hidden="true">↗</span></Link></div>
    </article>
  );
}
