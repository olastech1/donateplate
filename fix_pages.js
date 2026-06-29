const fs = require('fs');
const path = require('path');

const dir = '/Users/olastrch/Documents/Mobile App/donateplate/client/src/pages';
const files = ['ContactPage.jsx', 'PrivacyPage.jsx', 'RefundPolicyPage.jsx', 'TermsPage.jsx'];

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Add useSettings import
  if (!content.includes('useSettings')) {
    content = content.replace(
      "import { settingsAPI } from '../services/api';",
      "import { settingsAPI } from '../services/api';\nimport { useSettings } from '../context/SettingsContext';"
    );
  }

  // Inject platformName into the component
  const componentMatch = content.match(/export default function \w+\(\) \{\n/);
  if (componentMatch && !content.includes('const { platformSettings }')) {
    content = content.replace(
      componentMatch[0],
      `${componentMatch[0]}  const { platformSettings } = useSettings();\n  const platformName = platformSettings?.platform_name || 'DonatePlate';\n`
    );
  }

  // Replace DonatePlate in the defaultContent
  content = content.replace(/DonatePlate/g, '${platformName}');
  
  // Also fix the emails in ContactPage
  content = content.replace(/support@\$\{platformName\}\.com/g, 'support@${platformName.replace(/\\s+/g, "").toLowerCase()}.com');
  content = content.replace(/press@\$\{platformName\}\.com/g, 'press@${platformName.replace(/\\s+/g, "").toLowerCase()}.com');

  fs.writeFileSync(p, content);
  console.log('Fixed', file);
}
