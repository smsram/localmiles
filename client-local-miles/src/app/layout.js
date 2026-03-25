import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata = {
  title: 'Local Miles',
  description: 'P2P Logistics Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}