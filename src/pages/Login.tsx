
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Hotel } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication - in real app, this would be API call
    if (credentials.username === 'root' && credentials.password === 'root') {
      localStorage.setItem('userRole', 'superadmin');
      localStorage.setItem('username', 'root');
      localStorage.setItem('loginTime', new Date().toISOString());
      toast({ title: "Login successful", description: "Welcome back, Super Admin!" });
      navigate('/dashboard');
    } else {
      // Check for regular users (this would normally be from database)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.username === credentials.username && u.password === credentials.password);
      
      if (user) {
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);
        localStorage.setItem('loginTime', new Date().toISOString());
        toast({ title: "Login successful", description: `Welcome back, ${user.username}!` });
        navigate('/dashboard');
      } else {
        toast({ 
          title: "Login failed", 
          description: "Invalid username or password",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-white p-3 rounded-full">
              <Hotel className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">GuestFlow Login</CardTitle>
          <p className="text-muted-foreground">Hotel Customer Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
