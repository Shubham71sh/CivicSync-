import fs from 'fs';
import path from 'path';

const dirs = ['layouts', 'pages', 'components'].map(d => path.join('src', d));
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

const pages = [
  'LandingPage', 'DashboardOverview', 'CitizenOverview', 'BillSimplifier',
  'CivicGPS', 'FraudWatch', 'AIChat', 'SentimentAnalyzer', 'ImpactSimulator',
  'Roadmap', 'Archive', 'Settings', 'Support'
];

pages.forEach(p => {
  fs.writeFileSync(
    path.join('src', 'pages', p + '.jsx'),
    `export default function ${p}() { return <div className="p-8 text-white">${p}</div>; }`
  );
});

fs.writeFileSync(
  path.join('src', 'layouts', 'DashboardLayout.jsx'),
  `import { Outlet } from 'react-router-dom';
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-white">
      <div className="w-64 bg-card border-r border-border p-4">Sidebar Placeholder</div>
      <main className="flex-1 p-8"><Outlet /></main>
    </div>
  );
}`
);
