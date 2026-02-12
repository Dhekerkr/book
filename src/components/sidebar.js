import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaBars, FaHome, FaPlus, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    router.push('/signin');
  };

  const navigateTo = (path) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="btn btn-light shadow-lg position-fixed top-0 start-0 m-3 z-3"
        style={{ borderRadius: '50%', width: '45px', height: '45px', background:'#00f2fe', borderColor:'#00f2fe', boxShadow: '0 8px 20px rgb(0, 0, 0)' }}
      >
        <FaBars />
      </button>
      <div
        className={`position-fixed top-0 start-0 bg-white shadow h-100 p-4 transition ${
          open ? 'translate-x-0' : 'translate-x-n100'
        }`}
        style={{
          width: '250px',
          zIndex: 999,
          transition: 'transform 0.3s ease-in-out',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          background: 'linear-gradient(to bottom,rgb(126, 217, 228), rgb(205, 226, 228))',
        }}
      >
        <button
          onClick={toggleSidebar}
          className="btn btn-light position-absolute top-0 end-0 m-3"
          style={{ borderRadius: '50%', width: '35px', height: '35px', background:'rgb(126,217,228)', borderColor:'rgb(126,217,228)' }}
        >
          <FaTimes />
        </button>
        <h4 className="mb-4 fw-bold">Menu</h4>

        <button className="btn btn-outline-primary w-100 mb-3 text-start" onClick={() => navigateTo('/')}>
          <FaHome className="me-2" />
          Home
        </button>
        <button className="btn btn-outline-success w-100 mb-3 text-start" onClick={() => navigateTo('/AddBook')}>
          <FaPlus className="me-2" />
          Add a Book
        </button>
        <button className="btn btn-outline-danger w-100 text-start" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" />
          Logout
        </button>
      </div>
    </>
  );
};

export default Sidebar;
