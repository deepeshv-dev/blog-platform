import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/index.js';
import PostForm from '../components/PostForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function PostEditor({ editing = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get(`/posts/${id}`)
      .then(({ data }) => {
        if (data.post.author?._id !== user.id) { setError('You can only edit your own stories.'); return; }
        setPost(data.post);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [editing, id, user.id]);

  async function save(values) {
    try {
      const { data } = editing ? await api.put(`/posts/${id}`, values) : await api.post('/posts', values);
      notify(editing ? 'Your story has been updated.' : 'Your story has been published.');
      navigate(`/posts/${data.post._id}`);
    } catch (err) {
      const error = new Error(getErrorMessage(err));
      error.fields = err.response?.data?.fields || {};
      throw error;
    }
  }

  if (loading) return <div className="state-box">Loading your draft…</div>;
  if (error) return <div className="state-box error-state">{error} <Link to="/dashboard">Return to your desk</Link></div>;
  if (editing && !post) return <div className="state-box error-state">Story not found. <Link to="/dashboard">Return to your desk</Link></div>;
  return <section className="editor-page"><Link to="/dashboard" className="back-link">← Your writing desk</Link><div className="editor-heading"><span className="eyebrow">{editing ? 'MAKE IT BETTER' : 'A NEW FIELD NOTE'}</span><h1>{editing ? 'Revise your story.' : 'What’s on your mind?'}</h1><p>Good writing starts with paying attention. The rest can be edited.</p></div><PostForm key={post?._id || 'new'} initial={post || undefined} onSubmit={save} submitLabel={editing ? 'Save changes ↗' : 'Publish story ↗'} /></section>;
}
