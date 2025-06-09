
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Hotel } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 p-8">
        <div className="flex justify-center">
          <Hotel className="h-20 w-20 text-primary" />
        </div>
        <div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">GuestFlow</h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete Hotel Customer Management System
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl">
            Streamline your hotel operations with our comprehensive guest management solution. 
            Handle bookings, track occupancy, manage guests, and export reports with ease.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/login')}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Login to Dashboard
          </Button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>Super Admin:</strong> Username: root, Password: root</p>
            <p><strong>Features:</strong> User Management, Hotel Registration, Room Management, Guest Registration, Reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
