const fs = require('fs');
const path = require('path');

const dir = '/Users/olastrch/Documents/Mobile App/donateplate/client/src/pages';
const files = ['AdminDashboardPage.jsx', 'DashboardPage.jsx', 'LoginPage.jsx', 'RegisterPage.jsx'];

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Inject useSettings if missing
  if (!content.includes('useSettings')) {
    content = content.replace(
      "import { useState",
      "import { useSettings } from '../context/SettingsContext';\nimport { useState"
    );
  }

  // Inject platformName into the main component
  const componentMatch = content.match(/export default function \w+\(\) \{\n/);
  if (componentMatch && !content.includes('const { platformSettings }')) {
    content = content.replace(
      componentMatch[0],
      `${componentMatch[0]}  const { platformSettings } = useSettings();\n  const platformName = platformSettings?.platform_name || 'DonatePlate';\n`
    );
  }

  // Replace DonatePlate text nodes with {platformName}
  content = content.replace(/>DonatePlate</g, '>{platformName}<');
  content = content.replace(/ DonatePlate/g, ' {platformName}');
  
  fs.writeFileSync(p, content);
  console.log('Fixed', file);
}
