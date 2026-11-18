import ArticleForm from '../ArticleForm';

export default function NewArticlePage() {
  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Create New Story</h1>
        <p style={{ color: '#71717a', fontSize: 13, marginTop: 4 }}>
          Publish an authentic Telugu news story or short-form video dispatch.
        </p>
      </div>

      <ArticleForm />
    </div>
  );
}
