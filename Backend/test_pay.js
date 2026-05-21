const axios = require('axios');

async function testPay() {
  try {
    const res = await axios.post('http://localhost:5001/api/reimbursements/mark-paid/6a0eabfdc549dfb1d2d15740', {
      paid_amount: 3000,
      payment_date: '2026-05-21',
      payment_mode: 'Bank Transfer'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}

testPay();
