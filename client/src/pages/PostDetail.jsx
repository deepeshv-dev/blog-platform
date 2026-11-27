import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../components/PostCard.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const notify = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading'); setError('');
    try {
      const [postResponse, commentsResponse] = await Promise.all([api.get(`/posts/${id}`), api.get(`/comments/${id}`)]);
      setPost(postResponse.data.post);
      setComments(commentsResponse.data.comments);
      setStatus('ready');
    } catch (err) { setError(getErrorMessage(err)); setStatus('error'); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function addComment(event) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setError('');
    setCommentSubmitting(true);
    try {
      const { data } = await api.post(`/comments/${id}`, { commentText });
      setComments((existing) => [...existing, data.comment]);
      setCommentText('');
      notify('Your response has been posted.');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setCommentSubmitting(false); }
  }
  async function deleteComment(commentId) {
    if (!window.confirm('Delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((items) => items.filter((item) => item._id !== commentId));
      notify('Your response has been deleted.');
    }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setDeletingCommentId(''); }
  }

  if (status === 'loading') return <div className="state-box">Opening the story…</div>;
  if (status === 'error') return <div className="state-box error-state">{error}<button className="text-button" onClick={load}>Try again</button></div>;
  const isOwner = user && user.id === post.author?._id;
  return (
    <article className="article-page">
      <Link to="/" className="back-link">← All stories</Link>
      <header className="article-header"><span className="eyebrow">{post.category || 'OTHER'} · <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>{post.updatedAt && post.updatedAt !== post.createdAt && ` · UPDATED ${formatDate(post.updatedAt)}`}</span><h1>{post.title}</h1><div className="article-byline"><span className="author-avatar">{post.author?.username?.slice(0, 1).toUpperCase()}</span><span>Written by <strong>{post.author?.username}</strong></span>{isOwner && <Link className="edit-link" to={`/posts/${post._id}/edit`}>Edit story ↗</Link>}</div></header>
      <div className="article-body">{post.content.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      <section className="comments-section"><div className="comments-title"><div><span className="eyebrow">THE CONVERSATION</span><h2>Responses <span>{comments.length}</span></h2></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {user ? <form className="comment-form" onSubmit={addComment}><label className="sr-only" htmlFor="comment">Write a response</label><textarea id="comment" rows="3" maxLength="2000" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add something thoughtful…" required /><button className="button button-dark" disabled={!commentText.trim() || commentSubmitting}>{commentSubmitting ? 'Posting…' : 'Post response ↗'}</button></form> : <p className="comment-signin"><Link to="/login">Log in</Link> to join the conversation.</p>}
        {comments.length === 0 ? <p className="comments-empty">No responses yet. Start the conversation.</p> : <div className="comment-list">{comments.map((comment) => <article className="comment" key={comment._id}><span className="author-avatar">{comment.user?.username?.slice(0, 1).toUpperCase()}</span><div><div className="comment-meta"><strong>{comment.user?.username}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>{user?.id === comment.user?._id && <button className="text-button delete-link" disabled={Boolean(deletingCommentId)} onClick={() => deleteComment(comment._id)}>{deletingCommentId === comment._id ? 'Deleting…' : 'Delete'}</button>}</div><p>{comment.commentText}</p></div></article>)}</div>}
      </section>
    </article>
  );
}
