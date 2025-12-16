import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearnFlow - Modern Learning Platform',
  description: 'A beautiful and intuitive learning management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
