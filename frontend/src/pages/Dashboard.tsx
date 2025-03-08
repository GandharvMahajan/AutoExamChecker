import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="user-info">
        <h2>Welcome, {user?.name}!</h2>
        <p>Email: {user?.email}</p>
      </div>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Auto Exam Checker</h3>
          <p>You are now logged in to the Auto Exam Checker system.</p>
          <p>This is a protected dashboard that can only be accessed by authenticated users.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 