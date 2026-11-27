import { useState } from 'react';
import { POST_CATEGORIES } from '../constants.js';

export default function PostForm({ initial = { title: '', content: '', category: 'Other' }, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [category, setCategory] = useState(initial.category || 'Other');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    const errors = {};
    if (title.trim().length < 3) errors.title = 'Use at least 3 characters for the title.';
    if (!content.trim()) errors.content = 'Add some story text before publishing.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    try { await onSubmit({ title: title.trim(), content: content.trim(), category }); }
    catch (err) {
      setError(err.message || 'Could not save your story.');
      setFieldErrors(err.fields || {});
    }
    finally { setSaving(false); }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <label htmlFor="post-title">Story title</label>
      <input id="post-title" maxLength="160" minLength="3" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A title that stays with you" required aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'title-error' : undefined} />
      {fieldErrors.title && <p className="form-error" id="title-error">{fieldErrors.title}</p>}
      <label htmlFor="post-category">Category</label>
      <select id="post-category" value={category} onChange={(event) => setCategory(event.target.value)} aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? 'category-error' : undefined}>
        {POST_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      {fieldErrors.category && <p className="form-error" id="category-error">{fieldErrors.category}</p>}
      <div className="form-row"><label htmlFor="post-content">Your story</label><span>{content.length.toLocaleString()} / 30,000</span></div>
      <textarea id="post-content" maxLength="30000" rows="16" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Start with the part you can't stop thinking about…" required aria-invalid={Boolean(fieldErrors.content)} aria-describedby={fieldErrors.content ? 'content-error' : undefined} />
      {fieldErrors.content && <p className="form-error" id="content-error">{fieldErrors.content}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
