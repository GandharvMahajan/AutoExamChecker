import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, IS_DEVELOPMENT } from '../config/constants';
import { useAuth } from '../context/AuthContext';

interface CreditsData {
  testsPurchased: number;
  testsUsed: number;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
}

export const useCredits = (): CreditsData => {
  const { user, token, isAuthenticated } = useAuth();
  const [testsPurchased, setTestsPurchased] = useState<number>(user?.testsPurchased || 0);
  const [testsUsed, setTestsUsed] = useState<number>(user?.testsUsed || 0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async (): Promise<void> => {
    // If not authenticated, don't try to fetch
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Always try to call the backend API first
      try {
        // First try the payment endpoint for user credits
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/payment/user/credits`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );
        
        if (response.data.success) {
          setTestsPurchased(response.data.testsPurchased || 0);
          setTestsUsed(response.data.testsUsed || 0);
          return; // Exit early on success
        }
      } catch (apiError) {
        console.error('Error fetching credits from payment API:', apiError);
        // Continue to try the tests API as fallback
      }
      
      // Try the tests API as a fallback
      try {
        const testsResponse = await axios.get(
          `${API_BASE_URL}/api/v1/tests/userTests`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );
        
        if (testsResponse.data.success) {
          setTestsPurchased(testsResponse.data.testsPurchased || 0);
          setTestsUsed(testsResponse.data.testsUsed || 0);
          return; // Exit early on success
        }
      } catch (testsApiError) {
        console.error('Error fetching credits from tests API:', testsApiError);
      }
      
      // If both APIs fail and we're in development mode, use local user data
      if (IS_DEVELOPMENT) {
        // In development, use data from user context
        setTestsPurchased(user?.testsPurchased || 0);
        setTestsUsed(user?.testsUsed || 0);
      } else {
        // In production, show an error if both APIs failed
        setError('Could not fetch updated credit information');
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to fetch credit information');
      
      // Fallback to user context data
      setTestsPurchased(user?.testsPurchased || 0);
      setTestsUsed(user?.testsUsed || 0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits on mount and when user or token changes
  useEffect(() => {
    fetchCredits();
  }, [isAuthenticated, token, user?.testsPurchased, user?.testsUsed]);

  return {
    testsPurchased,
    testsUsed, 
    loading,
    error,
    refreshCredits: fetchCredits
  };
};

export default useCredits; 