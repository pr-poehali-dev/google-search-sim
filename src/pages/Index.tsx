import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Введи поисковый запрос');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const apiKey = 'AIzaSyCVAXiUzRBvOYT3OV5yF7ijNPLGGqz7LYI';
      const cx = '4452bb97441214b1d';
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}`
      );

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const results = data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink
        }));
        setSearchResults(results);
        toast.success(`Найдено ${results.length} результатов!`);
      } else {
        toast.info('Ничего не найдено. Попробуй другой запрос.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка поиска. Попробуй еще раз.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownloadSite = async (url: string) => {
    setIsDownloading(true);
    toast.loading('Выкачиваю сайт...', { id: 'download' });

    try {
      const response = await fetch(url, { mode: 'cors' });
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
      const jsScripts = Array.from(doc.querySelectorAll('script[src]'));
      
      let cssContent = '';
      for (const link of cssLinks) {
        const href = (link as HTMLLinkElement).href;
        try {
          const cssResponse = await fetch(href);
          cssContent += await cssResponse.text() + '\n';
        } catch (e) {
          console.error('CSS fetch error:', e);
        }
      }
      
      let jsContent = '';
      for (const script of jsScripts) {
        const src = (script as HTMLScriptElement).src;
        try {
          const jsResponse = await fetch(src);
          jsContent += await jsResponse.text() + '\n';
        } catch (e) {
          console.error('JS fetch error:', e);
        }
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      zip.file('index.html', html);
      zip.file('styles.css', cssContent);
      zip.file('script.js', jsContent);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `site-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Сайт успешно выкачан!', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка выкачивания. Попробуй с другим сайтом.', { id: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Вы вышли из аккаунта');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-box">
              <Icon name="User" size={20} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/20"
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 glow-text">
            GAMER SEARCH
          </h1>
          <p className="text-xl text-muted-foreground">
            🎮 Поиск, просмотр и выкачивание сайтов
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="glow-box rounded-lg p-1 bg-gradient-to-r from-primary/20 to-secondary/20">
            <div className="flex gap-2 bg-card rounded-lg p-4">
              <div className="relative flex-1">
                <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Введи запрос для поиска..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border focus:border-primary text-lg"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-primary hover:bg-primary/80 glow-box px-8"
              >
                {isSearching ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Ищу...
                  </>
                ) : (
                  <>
                    <Icon name="Zap" size={20} className="mr-2" />
                    Искать
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {searchResults.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Icon name="Target" size={28} className="text-primary" />
              Найдено: {searchResults.length} результатов
            </h2>
            
            {searchResults.map((result, index) => (
              <Card key={index} className="hover:glow-box transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <a 
                        href={result.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xl font-semibold text-primary hover:text-secondary transition-colors mb-2 block"
                      >
                        {result.title}
                      </a>
                      <p className="text-sm text-secondary/80 mb-2">{result.displayLink}</p>
                      <p className="text-muted-foreground">{result.snippet}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        onClick={() => handlePreview(result.link)}
                        className="bg-primary hover:bg-primary/80 glow-box"
                      >
                        <Icon name="Eye" size={18} className="mr-2" />
                        Просмотр
                      </Button>
                      <Button
                        onClick={() => handleDownloadSite(result.link)}
                        disabled={isDownloading}
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary/20"
                      >
                        <Icon name="Download" size={18} className="mr-2" />
                        Выкачать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-card border-primary/50">
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle className="flex items-center justify-between">
                <span className="text-primary glow-text">Предпросмотр сайта</span>
                <Button
                  onClick={() => setIsPreviewOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/20"
                >
                  <Icon name="X" size={20} />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="w-full h-[calc(90vh-100px)]">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Site Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
