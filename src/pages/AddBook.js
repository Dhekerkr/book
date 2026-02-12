import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '@/components/sidebar';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Container, Spinner, Alert } from 'react-bootstrap';

const AddBook = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverBase64, setCoverBase64] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setCoverBase64(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiClient('/api/books', {
        method: 'POST',
        body: {
          title,
          author,
          description,
          cover: coverBase64,
        },
      });

      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, rgb(44, 154, 250), #00f2fe)',
        padding: '20px',
      }}
    >
      <Sidebar />
      <div
        className="card shadow-lg p-5"
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1rem',
        }}
      >
        <h2 className="text-center mb-4 fw-bold">Add a New Book</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Author</label>
            <input
              type="text"
              className="form-control"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter book description"
              rows={4}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Cover Image</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImageUpload}
              required
            />
          </div>

          {coverBase64 && (
            <div className="mb-3 text-center">
              <img
                src={coverBase64}
                alt="Cover Preview"
                className="img-thumbnail"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 mt-3 fw-bold" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
