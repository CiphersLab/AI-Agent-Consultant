'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/app/components/ui/Logo';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Get credentials from environment (set in .env.local)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    // Simple authentication check
    if (email === adminEmail && password === adminPassword) {
      localStorage.setItem('admin_auth', 'authenticated');
      router.push('/admin');
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={true} href={null} /> {/* ADD THIS */}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the leads dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={error}
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Login
          </Button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Contact your administrator if you forgot your credentials
          </p>
        </div>
      </Card>
    </div>
  );
}