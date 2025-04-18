import { Buffer } from 'buffer'
import { QueryClient } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider,deserialize, serialize } from 'wagmi'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import App from './App.tsx'
import { config } from './wagmi.ts'
import './index.css'
import { AuthProvider } from './components/context.tsx'

globalThis.Buffer = Buffer

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const persister = createSyncStoragePersister({
  serialize,
  storage: window.localStorage,
  deserialize,
})


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <AuthProvider>
       
          <App/>
       
          
        </AuthProvider>
      </PersistQueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
