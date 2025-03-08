import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5002/');
        const data = await response.json();
        setMessage(data.message);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Failed to connect to the backend');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container">
      <h1>AutoExamChecker</h1>
      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>{message}</p>
        )}
      </div>
      <p className="read-the-docs">
        A full-stack application for automated exam checking
      </p>
    </div>
  )
}

export default App
