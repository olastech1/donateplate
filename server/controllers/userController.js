const pool = require('../config/db');

// Update KYC status to pending
const submitKyc = async (req, res) => {
  try {
    const { id } = req.user;
    
    // In a real app we'd save document URLs here
    // For now we just update the status to 'pending'
    
    const result = await pool.query(
      `UPDATE users SET kyc_status = 'pending', updated_at = NOW()
       WHERE id = $1 RETURNING id, name, email, role, kyc_status`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    res.json({
      success: true,
      message: 'KYC submitted successfully. Pending admin approval.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Submit KYC error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT id, name, email, role, kyc_status, avatar_url, created_at FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { submitKyc, getMe };
