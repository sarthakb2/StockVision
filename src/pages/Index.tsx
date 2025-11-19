
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Add a handler for navigating to stock analysis
  const handleStockSelection = (ticker: string) => {
    navigate(`/analysis?symbol=${ticker}`);
  };

  return (
    <>
      <Navbar />
      {isAuthenticated ? <Dashboard /> : <LandingPage />}
    </>
  );
};

export default Index;
