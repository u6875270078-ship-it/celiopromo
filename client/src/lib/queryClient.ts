import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Default fetcher function
export const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = queryKey[0] as string;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Set default query function
queryClient.setQueryDefaults([], {
  queryFn: defaultQueryFn,
});

// Helper function for API requests with mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const error = new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
      (error as any).status = response.status;
      (error as any).response = { data: errorData };
      throw error;
    }
    
    return response.json();
  } catch (error: any) {
    console.error('API Request failed:', {
      url,
      error: error.message,
      status: error.status,
      response: error.response
    });
    throw error;
  }
};