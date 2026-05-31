const pool = require('../config/db');

exports.getPublicSettings = async (req, res) => {
  try {
    // Only fetch non-encrypted settings to be safe
    const result = await pool.query(`
      SELECT setting_key, setting_value 
      FROM platform_settings 
      WHERE is_encrypted = false
    `);
    
    // Convert array of rows into a key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
