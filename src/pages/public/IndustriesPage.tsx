import React from 'react';
import { useTheme } from '../../components/ThemeProvider';

export default function IndustriesPage() {
  const { t: translate } = useTheme();
  return (
    <div className="min-h-screen pt-24 px-8">
      <h1 className="text-4xl font-bold mb-8">Industries</h1>
      <p>Industries we serve.</p>
    </div>
  );
}
