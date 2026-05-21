require('dotenv').config();
const mongoose = require('mongoose');
const Reimbursement = require('./models/ReimbursementModel');

async function test() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to URI:', uri);
  await mongoose.connect(uri);
  console.log('Connected to Atlas DB');
  const claims = await Reimbursement.find({});
  console.log('Claims:', claims.length);
  for (let c of claims) {
    console.log(`ID: ${c._id}, Claim: ${c.claim_number}, Status: ${c.approval_status}, PayStatus: ${c.payment_status}, Due: ${c.due_amount}`);
  }
  await mongoose.disconnect();
}

test();
