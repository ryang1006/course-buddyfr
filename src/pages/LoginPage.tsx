import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Library, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';



export default function LoginPage() {
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

    const handleMagicLink = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!username) {
        setError('Please enter your username first');
        return;
      }

      setIsLoading(true);
      setError('');

      // Define the email variable that was missing from your scope
      const input = username.trim().toLowerCase();
      const email = input.includes('@') ? input : `${input}@mapua.edu.ph`;

      console.log("FINAL EMAIL BEING SENT:", email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email, // This now has a valid value
        options: {
          emailRedirectTo: 'http://localhost:3000/dashboard',
        }
      });

      if (error) {
        setError(error.message);
      } else {
        alert(`Magic link sent to ${email}!`);
      }
      setIsLoading(false);
    };
  

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      // Convert username to the email format you used in Supabase
      const email = username.trim();
      console.log("SENDING TO SUPABASE:", { username, password });
      console.log("LOGIN ATTEMPT WITH:", email);
      const success = await login(email, password); // AuthContext now uses email
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
      
      setIsLoading(false);
    };

    
    useEffect(() => {
    const checkConnection = async () => {
      // 1. Try to pull any data from the public 'books' table
      const { data, error } = await supabase.from('books').select('id').limit(1);
      
      if (error) {
        console.error("❌ DATABASE UNREACHABLE:", error.message);
      } else {
        console.log("✅ DATABASE CONNECTED: We are talking to Supabase!");
      }

      // 2. Log the URL being used to confirm it matches your Dashboard
      console.log("Project URL:", import.meta.env.VITE_SUPABASE_URL);
    };
    
    checkConnection();
  }, []);

  
    

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <Library className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">MCCLRS</h1>
          <p className="text-xl text-white/80 mb-2">
            Mapúa Course Coding and Learning Resource System
          </p>
          <p className="text-white/60">
            Automated book allocation for course coding compliance
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-white/60 text-sm">Books</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">15</p>
              <p className="text-white/60 text-sm">Courses</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">6</p>
              <p className="text-white/60 text-sm">Departments</p>
            </div>
          </div>
        </div>

      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">MCCLRS</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access the library management system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-danger/10 border border-danger/20 rounded-lg animate-scale-in">
                <AlertCircle className="w-5 h-5 text-danger" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm text-primary hover:text-primary/80">
                Forgot password?
              </a>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

                      {/* New Magic Link Button */}
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-11 border-primary text-primary hover:bg-primary/5"
                onClick={handleMagicLink}
                disabled={isLoading || !username}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send Magic Link Login'
                )}
              </Button>


          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Admin:</p>
                <p className="font-mono">admin / admin123</p>
              </div>
              <div>
                <p className="text-muted-foreground">Librarian:</p>
                <p className="font-mono">librarian / lib123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
