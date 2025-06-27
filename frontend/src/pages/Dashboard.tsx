import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '@/components/ui/card';

// This is a placeholder dashboard. Refactor as needed for admin or user roles.
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'delivery') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this dashboard.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <p className="text-gray-600">Welcome! This dashboard can be customized for admin or user roles.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 