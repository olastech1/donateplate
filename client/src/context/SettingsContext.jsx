import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings/public');
        if (res.data && res.data.success) {
          setPlatformSettings(res.data.data);
          
          // Update document title if platform_name exists
          if (res.data.data.platform_name) {
            document.title = `${res.data.data.platform_name} - Crowdfunding Platform`;
          }
        }
      } catch (err) {
        console.error('Failed to fetch platform settings', err);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ platformSettings, settingsLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
