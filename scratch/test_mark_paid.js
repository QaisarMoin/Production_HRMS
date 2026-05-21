const mongoose = require('mongoose');
const Reimbursement = require('./models/ReimbursementModel');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/hrms');
  console.log('Connected');
  const claims = await Reimbursement.find({});
  console.log('Claims:', claims.length);
  for (let c of claims) {
    console.log(`ID: ${c._id}, Claim: ${c.claim_number}, Status: ${c.approval_status}, PayStatus: ${c.payment_status}`);
    if (c.approval_status === 'Approved') {
      try {
        c.paid_amount = c.total_amount;
        c.payment_status = 'Paid';
        await c.save();
        console.log('Successfully saved payment for', c.claim_number);
      } catch (err) {
        console.error('Error saving:', err.message);
      }
    }
  }
  await mongoose.disconnect();
}

test();
