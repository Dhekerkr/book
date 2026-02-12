import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, signup } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [loading, user, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signup(username.trim(), password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, rgb(44, 154, 250), #00f2fe)',
        padding: '20px',
      }}
    >
      <Card className="p-5 shadow-lg text-center border-0 rounded" style={{ width: '30rem', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Card.Body>
          <Card.Title className="mb-4 text-primary" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Create Account</Card.Title>
          <Card.Text className="mb-4 text-muted">Sign up to start sharing book reviews</Card.Text>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group className="mb-3 text-start">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 text-start">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="px-4 py-2 rounded-pill shadow-sm w-100" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Sign up'}
              </Button>
              <div className="mt-3">
                Already have an account? <Link href="/signin">Sign in</Link>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Signup;
