
import React from 'react';
import { useStock } from '@/contexts/StockContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Market: React.FC = () => {
  const { news, likeNews, saveNews } = useStock();

  // Handle liking a news article
  const handleLikeNews = (id: string) => {
    likeNews(id);
    toast({
      title: "Update",
      description: "Your preference has been saved",
    });
  };

  // Handle saving a news article
  const handleSaveNews = (id: string) => {
    saveNews(id);
    toast({
      title: "Update",
      description: "News article has been saved",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Financial Market News</h1>
      <p className="text-muted-foreground mb-8">Stay informed with the latest updates and insights</p>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All News</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="market">Market Updates</TabsTrigger>
          <TabsTrigger value="stocks">Stock News</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {/* Categories Carousel */}
          <ScrollArea className="w-full whitespace-nowrap mb-8">
            <div className="flex space-x-4 pb-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {news.map((item) => (
              <Card key={item.id} className="glass-card overflow-hidden flex flex-col animate-fade-in">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{item.headline}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4">{item.summary}</p>
                  <div className="text-sm text-muted-foreground">Source: {item.source}</div>
                </div>
                
                <CardFooter className="border-t bg-muted/50 p-4 mt-auto">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLikeNews(item.id)}
                        className={item.liked ? 'text-primary' : ''}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span className="sr-only md:not-sr-only md:text-xs">Like</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        <span className="sr-only md:not-sr-only md:text-xs">Dislike</span>
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSaveNews(item.id)}
                    >
                      {item.saved ? (
                        <BookmarkCheck className="h-4 w-4 mr-1" />
                      ) : (
                        <Bookmark className="h-4 w-4 mr-1" />
                      )}
                      <span className="sr-only md:not-sr-only md:text-xs">Save</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button variant="outline">Load More News</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="trending">
          <div className="py-12 text-center">
            <h3 className="text-xl mb-4">Trending News</h3>
            <p className="text-muted-foreground mb-6">The most discussed and shared financial stories</p>
            <Button variant="outline">Coming Soon</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="market">
          <div className="py-12 text-center">
            <h3 className="text-xl mb-4">Market Updates</h3>
            <p className="text-muted-foreground mb-6">Comprehensive updates on market movements</p>
            <Button variant="outline">Coming Soon</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="stocks">
          <div className="py-12 text-center">
            <h3 className="text-xl mb-4">Stock News</h3>
            <p className="text-muted-foreground mb-6">Latest news about individual stocks</p>
            <Button variant="outline">Coming Soon</Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Market Snapshot */}
      <h2 className="text-2xl font-bold mb-4">Market Snapshot</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {marketIndices.map((index) => (
          <Card key={index.name} className="glass-card">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-1">{index.name}</div>
              <div className="text-2xl font-bold">{index.value.toLocaleString()}</div>
              <div className={`text-sm ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {index.change >= 0 ? '+' : ''}{index.change} ({index.changePercent}%)
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Categories for news filtering
const categories = [
  'All',
  'Markets',
  'Stocks',
  'Cryptocurrency',
  'Commodities',
  'Forex',
  'Economy',
  'Business',
  'Technology',
  'Energy',
  'Real Estate'
];

// Market indices data
const marketIndices = [
  { name: 'S&P 500', value: 4582.64, change: +25.19, changePercent: '+0.55%' },
  { name: 'Dow Jones', value: 38563.12, change: +172.38, changePercent: '+0.45%' },
  { name: 'Nasdaq', value: 15690.50, change: +196.95, changePercent: '+1.25%' },
  { name: 'Russell 2000', value: 2133.98, change: -8.52, changePercent: '-0.40%' },
];

export default Market;
