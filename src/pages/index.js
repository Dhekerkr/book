import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Card, Row, Col, Spinner } from 'react-bootstrap';
import Sidebar from '@/components/sidebar';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(true);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let active = true;

    async function fetchBooks() {
      if (!user) {
        setLoadingBooks(false);
        return;
      }

      try {
        const data = await apiClient('/api/books', { method: 'GET' });
        if (active) {
          setBooks(data);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        if (active) {
          setLoadingBooks(false);
        }
      }
    }

    fetchBooks();

    return () => {
      active = false;
    };
  }, [user]);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingBooks) {
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
      className="position-relative"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, rgb(44, 154, 250), #00f2fe)',
        padding: '20px',
      }}
    >
      <Sidebar />
      <Container>
        <h1
          className="text-center mb-5 fw-bold"
          style={{
            fontSize: '3rem',
            color: '#fff',
            textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
            letterSpacing: '1px',
          }}
        >
          List of Books
        </h1>

        <div className="mb-4 text-center">
          <input
            type="text"
            className="form-control"
            placeholder="Search for a book by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '400px', margin: '0 auto' }}
          />
        </div>

        <Row className="g-4 justify-content-center">
          {filteredBooks.map((book) => (
            <Col key={book.id} xs={12} sm={6} md={4} lg={3}>
              <Card
                className="h-100 shadow-sm"
                onClick={() => router.push(`/book/${book.id}`)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  height: '100%',
                }}
              >
                <div style={{ height: '250px', overflow: 'hidden' }}>
                  <Card.Img
                    variant="top"
                    src={book.cover}
                    alt={book.title}
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <Card.Body>
                  <Card.Title className="text-truncate">{book.title}</Card.Title>
                  <Card.Text className="text-muted text-truncate">{book.author}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {filteredBooks.length === 0 && (
          <div className="text-white text-center mt-4 fw-semibold fs-5">
            No books found with {searchTerm}.
          </div>
        )}
      </Container>
    </div>
  );
};

export default Home;
