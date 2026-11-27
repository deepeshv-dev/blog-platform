import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/index.js';
import { POST_CATEGORIES } from '../constants.js';
import PostCard from '../components/PostCard.jsx';

const PAGE_SIZE = 9;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');
    api.get('/posts', { params: { q: query || undefined, category: category || undefined, sort, page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (active) {
          setPosts(data.posts);
          setPagination(data.pagination);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err));
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, [query, category, sort, page, reload]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  function clearFilters() {
    setSearch('');
    setQuery('');
    setCategory('');
    setSort('newest');
    setPage(1);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="live-dot" /> A JOURNAL FOR THE CURIOUS</span><h1>Ideas worth<br /><em>making room for.</em></h1><p>Thoughtful stories from people paying attention. Find a new perspective, or share one of your own.</p>
          <div className="hero-actions"><Link className="button button-dark" to="/register">Find your voice <span>↗</span></Link><a className="underlined-link" href="#stories">Explore the journal ↓</a></div>
        </div>
        <div className="hero-art" aria-label="Abstract illustration of layered paper"><div className="art-sun" /><div className="art-paper paper-back" /><div className="art-paper paper-mid" /><div className="art-paper paper-front"><span>slow<br />thoughts<br /><i>✳</i></span></div><span className="art-caption">VOL. 01 — NOTES ON NOTICING</span></div>
        <div className="hero-index"><span>01</span><span>READ · REFLECT · RESPOND</span><span>↘</span></div>
      </section>
      <section id="stories" className="stories-section">
        <div className="section-heading"><div><span className="eyebrow">THE LATEST</span><h2>Stories to sit with.</h2></div><form className="search-form" onSubmit={submitSearch}><label className="sr-only" htmlFor="search">Search stories</label><input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or story…" /><button aria-label="Search stories">⌕</button></form></div>
        <div className="story-controls">
          <label>Category
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {POST_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Sort
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <span className="story-total">{pagination.total} {pagination.total === 1 ? 'story' : 'stories'}</span>
          {(query || category || sort !== 'newest') && <button className="text-button clear-filters" onClick={clearFilters}>Clear filters</button>}
        </div>
        {query && <div className="filter-line">Showing stories matching “{query}”</div>}
        {status === 'loading' && <div className="state-box" role="status">Gathering stories…</div>}
        {status === 'error' && <div className="state-box error-state" role="alert">{error} <button className="text-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
        {status === 'ready' && posts.length === 0 && <div className="empty-state"><span className="empty-mark">✳</span><h3>No stories found.</h3><p>Try a different search or category, or be the first to write.</p><Link className="underlined-link" to="/register">Start writing ↗</Link></div>}
        {status === 'ready' && posts.length > 0 && <div className="post-grid">{posts.map((post, index) => <PostCard key={post._id} post={post} featured={index === 0 && page === 1 && !query && !category} />)}</div>}
        {status === 'ready' && pagination.totalPages > 1 && (
          <nav className="pagination" aria-label="Story pages">
            <button className="button button-outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="button button-outline" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next →</button>
          </nav>
        )}
      </section>
    </>
  );
}
