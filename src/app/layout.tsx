import { ReactNode } from 'react';
import '../styles/index.css';

export const metadata = {
  title: 'Fitness & Nutrition Dashboard',
  description: 'Track your fitness, BMI, calories, workouts, and self-care metrics.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/fitness/favicon.ico" />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
