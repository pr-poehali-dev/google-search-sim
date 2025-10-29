import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

declare global {
  interface Window {
    __gcse?: {
      callback?: () => void;
    };
  }
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cse.google.com/cse.js?cx=4452bb97441214b1d';
    script.async = true;
    document.body.appendChild(script);

    window.__gcse = {
      callback: () => {
        const searchElement = document.querySelector('.gcse-search');
        if (searchElement) {
          const observer = new MutationObserver(() => {
            extractSearchResults();
          });
          observer.observe(searchElement, { childList: true, subtree: true });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const extractSearchResults = () => {
    setTimeout(() => {
      const results: SearchResult[] = [];
      const resultElements = document.querySelectorAll('.gsc-webResult');
      
      resultElements.forEach((element) => {
        const titleEl = element.querySelector('.gs-title') as HTMLElement;
        const linkEl = element.querySelector('.gs-title b') as HTMLElement;
        const snippetEl = element.querySelector('.gs-snippet') as HTMLElement;
        const displayLinkEl = element.querySelector('.gsc-url-top') as HTMLElement;
        
        if (titleEl && linkEl && snippetEl) {
          const link = titleEl.closest('a')?.href || '';
          results.push({
            title: titleEl.innerText || '',
            link: link,
            snippet: snippetEl.innerText || '',
            displayLink: displayLinkEl?.innerText || ''
          });
        }
      });
      
      if (results.length > 0) {
        setSearchResults(results);
      }
    }, 1000);
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownloadSite = async (url: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 glow-text">
            GAMER SEARCH
          </h1>
          <p className="text-xl text-muted-foreground">
            🎮 Поиск, просмотр и выкачивание сайтов
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="glow-box rounded-lg p-1 bg-gradient-to-r from-primary/20 to-secondary/20">
            <div className="gcse-search bg-card rounded-lg"></div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Icon name="Search" size={28} className="text-primary" />
              Результаты поиска
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
                        disabled={isLoading}
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

        <style>{`
          .gcse-search {
            background: transparent !important;
          }
          
          .gsc-control-cse {
            background-color: transparent !important;
            border: none !important;
            padding: 0 !important;
          }
          
          .gsc-input-box {
            background: hsl(var(--input)) !important;
            border: 2px solid hsl(var(--border)) !important;
            border-radius: 0.5rem !important;
          }
          
          .gsc-input {
            color: hsl(var(--foreground)) !important;
            font-family: 'Rubik', sans-serif !important;
          }
          
          .gsc-search-button {
            background: hsl(var(--primary)) !important;
            border: none !important;
            border-radius: 0.5rem !important;
          }
          
          .gsc-results {
            display: none !important;
          }
          
          .gsc-result {
            background: transparent !important;
            border: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}
