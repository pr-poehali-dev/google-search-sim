import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const AUTH_API = 'https://functions.poehali.dev/91c8a533-dd7a-4551-9d88-f85703808bb0';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Добро пожаловать, ${data.user.username}!`);
        navigate('/');
      } else {
        toast.error(data.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <Card className="w-full max-w-md relative z-10 glow-box bg-card/95 backdrop-blur-sm border-primary/30">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold glow-text">
            <Icon name="LogIn" size={32} className="inline mr-2" />
            ВХОД
          </CardTitle>
          <CardDescription className="text-muted-foreground">Войди в свой аккаунт прямо сейчас!</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Icon name="Mail" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-input border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Пароль</Label>
              <div className="relative">
                <Icon name="Lock" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-input border-border focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/80 glow-box text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="Rocket" size={20} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Нет аккаунта?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-secondary font-semibold transition-colors"
              >
                Зарегистрируйся
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}