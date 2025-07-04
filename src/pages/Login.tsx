
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Hotel } from 'lucide-react';
import LoginService from '@/services/login';

// Define interfaces here
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
  username: string;
}

const Login = () => {
  const [credentials, setCredentials] = useState<LoginRequest>({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await LoginService.login(credentials);

      console.log("Response of user", user);

      // Store in sessionStorage to match Dashboard expectations
      sessionStorage.setItem('token', user.token);
      sessionStorage.setItem('userRole', user.role);
      sessionStorage.setItem('username', user.username);
      sessionStorage.setItem('loginTime', new Date().toISOString());

      toast({
        title: 'Login successful',
        description: `Welcome back, ${user.username}!`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error?.response?.data?.message || 'Invalid username or password',
        variant: 'destructive',
      });
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
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
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
