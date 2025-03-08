import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to AutoExamChecker</h1>
        <p className="hero-text">
          A powerful platform for automated exam checking and grading
        </p>
        
        {!isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        )}
        
        {isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Automated Grading</h3>
            <p>
              Save time by automating the exam grading process with our
              advanced AI technology.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Analytics</h3>
            <p>
              Get comprehensive insights into student performance with detailed
              analytics and reports.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Custom Rubrics</h3>
            <p>
              Create custom grading rubrics tailored to your specific exam
              requirements and criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 