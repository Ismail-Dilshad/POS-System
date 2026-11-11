/**
 * Test component for refresh functionality
 * This can be used to test the deep refresh implementation
 */

import { Button } from '@/components/ui/button';
import { 
    robustDeepRefresh, 
    simpleDeepRefresh, 
    iframeDeepRefresh 
} from '@/utils/deep-refresh';
import { RefreshCw, RotateCcw, RotateCw } from 'lucide-react';
import { useState } from 'react';

export function RefreshTest() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRobustRefresh = async () => {
        setIsRefreshing(true);
        try {
            await robustDeepRefresh({
                showLoading: true,
                loadingMessage: 'Testing robust refresh...',
                clearCaches: true
            });
        } catch (error) {
            console.error('Robust refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSimpleRefresh = () => {
        setIsRefreshing(true);
        try {
            simpleDeepRefresh();
        } catch (error) {
            console.error('Simple refresh failed:', error);
            setIsRefreshing(false);
        }
    };

    const handleIframeRefresh = () => {
        setIsRefreshing(true);
        try {
            iframeDeepRefresh();
        } catch (error) {
            console.error('Iframe refresh failed:', error);
            setIsRefreshing(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Refresh Test Component</h3>
            <p className="text-sm text-muted-foreground">
                Test different refresh methods to ensure they work properly
            </p>
            
            <div className="flex gap-2">
                <Button
                    onClick={handleRobustRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Robust Refresh
                </Button>
                
                <Button
                    onClick={handleSimpleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Simple Refresh
                </Button>
                
                <Button
                    onClick={handleIframeRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RotateCw className="h-4 w-4" />
                    Iframe Refresh
                </Button>
            </div>
            
            {isRefreshing && (
                <p className="text-sm text-blue-600">
                    Refreshing... Please wait
                </p>
            )}
        </div>
    );
}
