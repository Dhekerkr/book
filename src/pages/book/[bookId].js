import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Card, Button, Form, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const BookDetails = () => {
  const [book, setBook] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(1);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { bookId } = router.query;
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let active = true;

    async function loadBook() {
      if (!bookId || !user) {
        setLoadingBook(false);
        return;
      }

      try {
        const data = await apiClient(`/api/books/${bookId}`, { method: 'GET' });
        if (active) {
          setBook(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to fetch book');
        }
      } finally {
        if (active) {
          setLoadingBook(false);
        }
      }
    }

    loadBook();

    return () => {
      active = false;
    };
  }, [bookId, user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!bookId) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiClient(`/api/books/${bookId}/reviews`, {
        method: 'POST',
        body: {
          rating,
          comment: review,
        },
      });

      const updated = await apiClient(`/api/books/${bookId}`, { method: 'GET' });
      setBook(updated);
      setReview('');
      setRating(1);
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingBook) {
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
        background: 'linear-gradient(to bottom,rgb(126, 217, 228), rgb(205, 226, 228))',
        padding: '20px',
      }}
    >
      <Container className="py-5">
        <Button
          variant="secondary"
          className="mb-4"
          onClick={() => router.push('/')}
        >
          Back
        </Button>

        {error && <Alert variant="danger">{error}</Alert>}

        {book && (
          <Card className="p-4 shadow-lg">
            <Card.Img
              variant="top"
              src={book.cover}
              alt={book.title}
              className="img-fluid mb-3"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            <Card.Body>
              <Card.Title className="text-primary">{book.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">{book.author}</Card.Subtitle>
              <Card.Text>{book.description}</Card.Text>
              <Card.Text className="text-muted">Created by: {book.created_by_username}</Card.Text>
            </Card.Body>
          </Card>
        )}

        <h2 className="mt-4">Write a Review</h2>
        <Form onSubmit={handleSubmitReview}>
          <Form.Group className="mb-3">
            <Form.Label>Review</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <Form.Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit" disabled={submitting || !review.trim()}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Form>

        <h2 className="mt-4">Reviews</h2>
        <ListGroup>
          {(book?.reviews || []).map((item) => (
            <ListGroup.Item key={item.id}>
              <strong>{item.reviewer_username} ({item.rating} stars)</strong>
              <p className="mb-1">{item.comment}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </div>
  );
};

export default BookDetails;
