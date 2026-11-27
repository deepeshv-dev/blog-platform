import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../components/PostCard.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/posts', { params: { author: user.id, page, limit: 20, sort: 'newest' } })
      .then(({ data }) => {
        if (active) {
          setPosts(data.posts);
          setTotal(data.pagination.total);
        }
      })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id, page, reload]);

  async function removePost(post) {
    if (!window.confirm(`Delete “${post.title}”? This also removes its comments.`)) return;
    setError('');
    setDeletingId(post._id);
    try {
      await api.delete(`/posts/${post._id}`);
      setPosts((items) => items.filter((item) => item._id !== post._id));
      const remaining = Math.max(0, total - 1);
      setTotal(remaining);
      if (page > 1 && (page - 1) * 20 >= remaining) setPage((value) => value - 1);
      notify('The story and its comments have been deleted.');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setDeletingId(''); }
  }

  const memberSince = user.createdAt ? formatDate(user.createdAt) : '—';
  return (
    <section className="dashboard">
      <div className="dashboard-heading"><div><span className="eyebrow">YOUR WRITING DESK</span><h1>Welcome back, {user.username}.</h1><p>Your ideas, all in one place.</p></div><Link className="button button-dark" to="/posts/new">Write a story <span>↗</span></Link></div>
      <div className="dashboard-stats"><div><strong>{total.toString().padStart(2, '0')}</strong><span>STORIES PUBLISHED</span></div><div><strong>{memberSince}</strong><span>MEMBER SINCE</span></div><div><strong>{user.email}</strong><span>ACCOUNT EMAIL</span></div></div>
      <section className="account-card" aria-labelledby="account-title"><div><span className="eyebrow">YOUR ACCOUNT</span><h2 id="account-title">{user.username}</h2></div><div><span>Email</span><strong>{user.email}</strong></div><div><span>Member since</span><strong>{memberSince}</strong></div></section>
      <div className="dashboard-list-heading"><h2>Your stories</h2><span>{total} {total === 1 ? 'story' : 'stories'}</span></div>
      {error && <div className="state-box error-state" role="alert">{error} <button className="text-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
      {loading ? <div className="state-box" role="status">Loading your stories…</div> : !error && posts.length === 0 ? <div className="empty-state dashboard-empty"><span className="empty-mark">✳</span><h3>Your first story is waiting.</h3><p>Every good journal starts with a first line.</p><Link className="underlined-link" to="/posts/new">Write your first story ↗</Link></div> : !error && <div className="dashboard-posts">{posts.map((post) => <article className="dashboard-post" key={post._id}><div className="dashboard-post-copy"><span className="eyebrow">{post.category || 'OTHER'} · PUBLISHED {formatDate(post.createdAt)}</span><h3><Link to={`/posts/${post._id}`}>{post.title}</Link></h3><p>{post.content.slice(0, 160)}{post.content.length > 160 ? '…' : ''}</p></div><div className="dashboard-actions"><Link to={`/posts/${post._id}/edit`}>Edit</Link><button className="text-button delete-link" disabled={Boolean(deletingId)} onClick={() => removePost(post)}>{deletingId === post._id ? 'Deleting…' : 'Delete'}</button></div></article>)}</div>}
      {!loading && total > 20 && <nav className="pagination" aria-label="Your story pages"><button className="button button-outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← Previous</button><span>Page {page} of {Math.ceil(total / 20)}</span><button className="button button-outline" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((value) => value + 1)}>Next →</button></nav>}
    </section>
  );
}
