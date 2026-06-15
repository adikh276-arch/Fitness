import { RouterProvider } from 'react-router';
import { router } from './routes';
import AuthWrapper from './components/AuthWrapper';
import { UserProvider } from '@/lib/userContext';

export default function App() {
  return (
    <AuthWrapper>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </AuthWrapper>
  );
}
