import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlowFeed } from './components/FlowFeed';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlowFeed />
    </QueryClientProvider>
  );
}

export default App
