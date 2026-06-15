'use client';

import { RouterProvider } from 'react-router';
import { router } from './routes';
import AuthWrapper from './components/AuthWrapper';
import { UserProvider } from '@/lib/userContext';
import '../lib/i18n'; // Initialize i18n

export default function AppClient() {
  return (
    <AuthWrapper>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </AuthWrapper>
  );
}
