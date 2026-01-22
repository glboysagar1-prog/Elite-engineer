import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  // Render a friendly error screen instead of crashing
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#e11d48' }}>Configuration Missing</h1>
      <p>The <code>VITE_CLERK_PUBLISHABLE_KEY</code> is missing from your environment variables.</p>
      <div style={{ background: '#f1f5f9', padding: 20, borderRadius: 8, margin: '20px 0' }}>
        <p style={{ fontWeight: 'bold', marginBottom: 8 }}>To fix this:</p>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Create or open <code>.env.local</code> in the <code>dashboard</code> folder.</li>
          <li>Add your Clerk Publishable Key:
            <pre style={{ background: '#0f172a', color: '#fff', padding: 10, borderRadius: 4, overflowX: 'auto', marginTop: 8 }}>
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
            </pre>
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.9em' }}>
        If you don't have a key, sign up at <a href="https://clerk.com" style={{ color: '#2563eb' }}>clerk.com</a>.
      </p>
    </div>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
