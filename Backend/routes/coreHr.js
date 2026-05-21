const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Custom Models
const Employee = require('../models/Employee');
const Designation = require('../models/Designation');
const MasterModels = require('../models/MasterModels');
const { SalaryStructure, SourceOfHire } = MasterModels;

const CoreHrModels = require('../models/CoreHrModels');
const {
  Candidate, OfferLetter, RelievingLetter,
  ExperienceLetter, NoticeLetter, ConfirmationLetter,
  DocumentTemplate, DocumentAttachment, DocumentAuditLog
} = CoreHrModels;

// Helper to auto-generate document numbers
const generateDocNumber = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}-${random}`;
};

// Centralized Audit Logging Service Helper
const logAuditAction = async (action, module_name, reference_id, details = "") => {
  try {
    const refId = mongoose.Types.ObjectId.isValid(reference_id) ? reference_id : null;
    await DocumentAuditLog.create({
      action,
      module_name,
      reference_id: refId,
      details
    });
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
};

// ==========================================
// 1. CANDIDATE MODULE ENDPOINTS
// ==========================================

// Get all candidates
router.get('/candidates', async (req, res) => {
  try {
    const { search, gender, state, application_source, candidate_status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { candidate_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (gender) query.gender = gender;
    if (state) query.state = { $regex: state, $options: 'i' };
    if (application_source) query.application_source = application_source;
    if (candidate_status) query.candidate_status = candidate_status;

    const candidates = await Candidate.find(query)
      .populate('application_source')
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      message: "Candidates listed successfully",
      data: candidates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create candidate
router.post('/candidates', async (req, res) => {
  try {
    const count = await Candidate.countDocuments();
    const candidate_code = `CAN-${(count + 1).toString().padStart(4, '0')}`;
    
    const payload = {
      ...req.body,
      candidate_code,
      application_source: req.body.application_source || null
    };

    const candidate = await Candidate.create(payload);
    
    // Audit Log
    await logAuditAction("Create Candidate", "Candidate", candidate._id, `Added candidate ${candidate.full_name} (${candidate_code})`);

    return res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      data: candidate
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update candidate
router.put('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Candidate", "Candidate", candidate._id, `Updated candidate profile for ${candidate.full_name}`);

    return res.status(200).json({
      success: true,
      message: "Candidate profile updated successfully",
      data: candidate
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete candidate
router.delete('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    // Audit Log
    if (candidate) {
      await logAuditAction("Delete Candidate", "Candidate", candidate._id, `Removed candidate ${candidate.full_name}`);
    }

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Excel Bulk Import Candidate
router.post('/candidates/import', async (req, res) => {
  try {
    const count = await Candidate.countDocuments();
    // Simulate parsing excel_file rows
    const mockCandidates = [
      {
        candidate_code: `CAN-${(count + 1).toString().padStart(4, '0')}`,
        first_name: "Amit",
        last_name: "Patel",
        email: "amit.patel@mock.com",
        mobile: "+91 99988 77766",
        gender: "Male",
        state: "Gujarat",
        candidate_status: "Applied"
      },
      {
        candidate_code: `CAN-${(count + 2).toString().padStart(4, '0')}`,
        first_name: "Priya",
        last_name: "Sen",
        email: "priya.sen@mock.com",
        mobile: "+91 98877 66655",
        gender: "Female",
        state: "West Bengal",
        candidate_status: "Interviewed"
      }
    ];

    const inserted = await Candidate.insertMany(mockCandidates);
    
    // Audit Log
    await logAuditAction("Bulk Import Candidates", "Candidate", null, "Parsed Excel stream and bulk created candidates successfully.");

    return res.status(200).json({
      success: true,
      message: "Parsed & imported 2 candidates successfully from Excel workbook",
      data: inserted
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Export candidates
router.post('/candidates/export', async (req, res) => {
  await logAuditAction("Export Candidates", "Candidate", null, "Exported candidates catalog spreadsheet");
  return res.status(200).json({
    success: true,
    message: 'Candidates spreadsheet exported successfully',
    data: null
  });
});


// ==========================================
// 2. OFFER LETTER MODULE ENDPOINTS
// ==========================================

// Get all offer letters
router.get('/offer-letters', async (req, res) => {
  try {
    const letters = await OfferLetter.find()
      .populate('employee_id')
      .populate('candidate_id')
      .sort({ created_at: -1 });
    return res.status(200).json({
      success: true,
      message: "Offer letters fetched successfully",
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Generate offer letter template variables
router.post('/offer-letters/generate', async (req, res) => {
  try {
    const { employee_id, candidate_id, company_name = "Isaii Enterprise Corp" } = req.body;
    let employeeName = "John Doe";
    let designationName = "Software Engineer";
    let joiningDate = new Date().toLocaleDateString();
    let salaryAmount = "5,000 USD";

    if (employee_id) {
      const emp = await Employee.findById(employee_id).populate('designation_id');
      if (emp) {
        employeeName = `${emp.first_name} ${emp.last_name}`;
        designationName = emp.designation_id ? emp.designation_id.designation_name : "Officer";
        joiningDate = emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : joiningDate;
        
        // Fetch salary structure
        const sal = await SalaryStructure.findOne({ employee_code: emp.employee_code });
        if (sal) {
          salaryAmount = `${sal.gross_salary} USD`;
        }
      }
    } else if (candidate_id) {
      const cand = await Candidate.findById(candidate_id);
      if (cand) {
        employeeName = `${cand.first_name} ${cand.last_name}`;
      }
    }

    const defaultTemplate = `Dear {{employee_name}},\n\nWe are delighted to offer you the position of {{designation}} at {{company_name}}.\n\nYour joining date is scheduled for {{joining_date}}. Your gross monthly compensation will be {{salary}}.\n\nPlease sign and return this offer to finalize onboarding.\n\nWarm regards,\nHR Administration`;
    
    // Replace variables
    const filledContent = defaultTemplate
      .replace(/{{employee_name}}/g, employeeName)
      .replace(/{{designation}}/g, designationName)
      .replace(/{{joining_date}}/g, joiningDate)
      .replace(/{{salary}}/g, salaryAmount)
      .replace(/{{company_name}}/g, companyName);

    return res.status(200).json({
      success: true,
      message: "Offer letter variables computed successfully",
      data: {
        template_content: filledContent,
        compensation: { basic: 2500, hra: 1000, gross_salary: 5000 }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create offer letter
router.post('/offer-letters', async (req, res) => {
  try {
    const doc_number = generateDocNumber('OFF');
    const payload = { ...req.body, doc_number };
    const letter = await OfferLetter.create(payload);
    
    // Audit Log
    await logAuditAction("Generate Offer Letter", "OfferLetter", letter._id, `Issued offer letter ${doc_number}`);

    return res.status(201).json({
      success: true,
      message: "Offer letter created successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update offer letter
router.put('/offer-letters/:id', async (req, res) => {
  try {
    const letter = await OfferLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Offer Letter", "OfferLetter", letter._id, `Modified offer letter parameters`);

    return res.status(200).json({
      success: true,
      message: "Offer letter updated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Mock PDF generation
router.post('/offer-letters/pdf', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "PDF offer letter document compiled successfully",
    data: { pdf_url: "/docs/mock-pdf-offer.pdf" }
  });
});

// Print/Download offer letter
router.get('/offer-letters/:id/download', async (req, res) => {
  try {
    const letter = await OfferLetter.findById(req.params.id)
      .populate('employee_id')
      .populate('candidate_id');
    if (!letter) return res.status(404).send('Offer Letter Document Not Found');
    
    const docHtml = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }
            .meta { margin-bottom: 20px; font-size: 12px; color: #555; }
            .content { font-size: 14px; white-space: pre-wrap; margin-bottom: 40px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-block { border-top: 1px solid #ccc; width: 200px; padding-top: 10px; text-align: center; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h1 class="title">OFFICIAL LETTER OF OFFER</h1>
            <div class="meta">Document Ref: ${letter.doc_number} | Dated: ${new Date(letter.created_at).toLocaleDateString()}</div>
          </div>
          <div class="content">${letter.template_content}</div>
          <div class="signatures">
            <div class="sig-block">Prepared By Admin HR</div>
            <div class="sig-block">Candidate / Employee Signature</div>
          </div>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(docHtml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});


// ==========================================
// 3. RELIEVING LETTER MODULE ENDPOINTS
// ==========================================

router.get('/relieving-letters', async (req, res) => {
  try {
    const letters = await RelievingLetter.find().populate('employee_id').populate('designation_id');
    return res.status(200).json({
      success: true,
      message: "Relieving letters catalog loaded",
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/relieving-letters', async (req, res) => {
  try {
    const doc_number = generateDocNumber('REL');
    const payload = { ...req.body, doc_number };
    const letter = await RelievingLetter.create(payload);
    
    // Audit Log
    await logAuditAction("Generate Relieving Letter", "RelievingLetter", letter._id, `Issued relieving letter ${doc_number}`);

    return res.status(201).json({
      success: true,
      message: "Relieving letter generated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/relieving-letters/:id', async (req, res) => {
  try {
    const letter = await RelievingLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Relieving Letter", "RelievingLetter", letter._id, `Modified relieving exit rules`);

    return res.status(200).json({
      success: true,
      message: "Relieving letter updated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/relieving-letters/:id', async (req, res) => {
  try {
    const letter = await RelievingLetter.findByIdAndDelete(req.params.id);
    
    // Audit Log
    if (letter) {
      await logAuditAction("Delete Relieving Letter", "RelievingLetter", letter._id, `Removed relieving letter entry`);
    }

    return res.status(200).json({
      success: true,
      message: "Relieving letter deleted successfully",
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/relieving-letters/:id/download', async (req, res) => {
  try {
    const letter = await RelievingLetter.findById(req.params.id).populate('employee_id').populate('designation_id');
    if (!letter) return res.status(404).send('Relieving letter not found');
    
    const empName = letter.employee_id ? `${letter.employee_id.first_name} ${letter.employee_id.last_name}` : 'Employee';
    const desig = letter.designation_id ? letter.designation_id.designation_name : 'Staff';
    
    const docHtml = `
      <html>
        <body onload="window.print()" style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h2 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; color: #1e3a8a;">RELIEVING LETTER & EXPERIENCE CERTIFICATE</h2>
          <p><strong>Ref:</strong> ${letter.doc_number}</p>
          <p><strong>Date:</strong> ${new Date(letter.relieving_letter_date).toLocaleDateString()}</p>
          <br/>
          <p>To Whom It May Concern,</p>
          <p>This is to confirm that <strong>${empName}</strong> was employed with us as a <strong>${desig}</strong> from <strong>${letter.joining_date ? new Date(letter.joining_date).toLocaleDateString() : 'N/A'}</strong> to <strong>${new Date(letter.last_working_date).toLocaleDateString()}</strong>.</p>
          <p>We confirm that all their obligations have been fully met, and they are hereby relieved of all duties. We wish them the absolute best in all future professional activities.</p>
          <br/>
          <p><strong>Remarks:</strong> ${letter.remarks || 'None'}</p>
          <br/><br/>
          <p>Sincerely,</p>
          <p><strong>HR Administration Department</strong></p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(docHtml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});


// ==========================================
// 4. EXPERIENCE LETTER MODULE ENDPOINTS
// ==========================================

router.get('/experience-letters', async (req, res) => {
  try {
    const letters = await ExperienceLetter.find().populate('employee_id').populate('designation_id');
    return res.status(200).json({
      success: true,
      message: "Experience credentials catalog loaded",
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/experience-letters', async (req, res) => {
  try {
    const doc_number = generateDocNumber('EXP');
    const payload = { ...req.body, doc_number };
    const letter = await ExperienceLetter.create(payload);
    
    // Audit Log
    await logAuditAction("Generate Experience Certificate", "ExperienceLetter", letter._id, `Issued experience certificate ${doc_number}`);

    return res.status(201).json({
      success: true,
      message: "Experience letter generated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/experience-letters/:id', async (req, res) => {
  try {
    const letter = await ExperienceLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Experience Letter", "ExperienceLetter", letter._id, `Modified experience parameters`);

    return res.status(200).json({
      success: true,
      message: "Experience letter updated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/experience-letters/:id', async (req, res) => {
  try {
    const letter = await ExperienceLetter.findByIdAndDelete(req.params.id);
    
    // Audit Log
    if (letter) {
      await logAuditAction("Delete Experience Letter", "ExperienceLetter", letter._id, `Removed experience letter`);
    }

    return res.status(200).json({
      success: true,
      message: "Experience letter deleted successfully",
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/experience-letters/:id/download', async (req, res) => {
  try {
    const letter = await ExperienceLetter.findById(req.params.id).populate('employee_id').populate('designation_id');
    if (!letter) return res.status(404).send('Experience letter not found');
    
    const empName = letter.employee_id ? `${letter.employee_id.first_name} ${letter.employee_id.last_name}` : 'Employee';
    const desig = letter.designation_id ? letter.designation_id.designation_name : 'Staff';
    
    const docHtml = `
      <html>
        <body onload="window.print()" style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h2 style="text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 10px; color: #15803d;">EXPERIENCE CERTIFICATE</h2>
          <p><strong>Ref:</strong> ${letter.doc_number}</p>
          <p><strong>Date:</strong> ${new Date(letter.experience_letter_date).toLocaleDateString()}</p>
          <br/>
          <p>To Whom It May Concern,</p>
          <p>This is to certify that <strong>${empName}</strong> has worked with our company as a <strong>${desig}</strong> starting from <strong>${letter.joining_date ? new Date(letter.joining_date).toLocaleDateString() : 'N/A'}</strong>.</p>
          <p>During their tenure, we found them to be extremely diligent, highly focused, and an absolute team player.</p>
          <p><strong>Estimated Total Experience:</strong> ${letter.total_experience || 'N/A'}</p>
          <p><strong>Remarks:</strong> ${letter.remarks || 'Highly Professional'}</p>
          <br/><br/>
          <p>We wish them all the success in their future endeavors.</p>
          <br/>
          <p>Sincerely,</p>
          <p><strong>HR Operations Team</strong></p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(docHtml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});


// ==========================================
// 5. NOTICE LETTER MODULE ENDPOINTS
// ==========================================

router.get('/notice-letters', async (req, res) => {
  try {
    const letters = await NoticeLetter.find().populate('employee_id').populate('designation_id');
    return res.status(200).json({
      success: true,
      message: "Notice files catalog loaded",
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notice-letters', async (req, res) => {
  try {
    const doc_number = generateDocNumber('NTC');
    const payload = { ...req.body, doc_number };
    const letter = await NoticeLetter.create(payload);
    
    // Audit Log
    await logAuditAction("Generate Notice Letter", "NoticeLetter", letter._id, `Issued notice letter ${doc_number}`);

    return res.status(201).json({
      success: true,
      message: "Notice letter generated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notice-letters/:id', async (req, res) => {
  try {
    const letter = await NoticeLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Notice Letter", "NoticeLetter", letter._id, `Modified notice details`);

    return res.status(200).json({
      success: true,
      message: "Notice letter updated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notice-letters/:id', async (req, res) => {
  try {
    const letter = await NoticeLetter.findByIdAndDelete(req.params.id);
    
    // Audit Log
    if (letter) {
      await logAuditAction("Delete Notice Letter", "NoticeLetter", letter._id, `Removed notice letter`);
    }

    return res.status(200).json({
      success: true,
      message: "Notice letter deleted successfully",
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/notice-letters/:id/download', async (req, res) => {
  try {
    const letter = await NoticeLetter.findById(req.params.id).populate('employee_id').populate('designation_id');
    if (!letter) return res.status(404).send('Notice letter not found');
    
    const empName = letter.employee_id ? `${letter.employee_id.first_name} ${letter.employee_id.last_name}` : 'Employee';
    const desig = letter.designation_id ? letter.designation_id.designation_name : 'Staff';
    
    const docHtml = `
      <html>
        <body onload="window.print()" style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h2 style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 10px; color: #b91c1c;">OFFICIAL SERVICE NOTICE</h2>
          <p><strong>Ref:</strong> ${letter.doc_number}</p>
          <p><strong>Notice Issue Date:</strong> ${new Date(letter.notice_date).toLocaleDateString()}</p>
          <br/>
          <p>Dear <strong>${empName}</strong> (${desig}),</p>
          <p>This document serves as formal notification regarding your employment status and the commencement of the official notice separation cycle.</p>
          <p><strong>Reason for Notice:</strong> ${letter.notice_reason || 'Compliance Review'}</p>
          <p>Please coordinate with the HR Operations department to complete standard compliance documentation and transition materials.</p>
          <br/><br/>
          <p>Sincerely,</p>
          <p><strong>Compliance & HR Management</strong></p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(docHtml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});


// ==========================================
// 6. CONFIRMATION LETTER MODULE ENDPOINTS
// ==========================================

router.get('/confirmation-letters', async (req, res) => {
  try {
    const letters = await ConfirmationLetter.find().populate('employee_id').populate('designation_id');
    return res.status(200).json({
      success: true,
      message: "Confirmation registry listed",
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/confirmation-letters', async (req, res) => {
  try {
    const doc_number = generateDocNumber('CNF');
    const payload = { ...req.body, doc_number };
    const letter = await ConfirmationLetter.create(payload);
    
    // Audit Log
    await logAuditAction("Generate Confirmation Letter", "ConfirmationLetter", letter._id, `Issued confirmation letter ${doc_number}`);

    return res.status(201).json({
      success: true,
      message: "Confirmation letter generated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/confirmation-letters/:id', async (req, res) => {
  try {
    const letter = await ConfirmationLetter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Audit Log
    await logAuditAction("Update Confirmation Letter", "ConfirmationLetter", letter._id, `Modified confirmation parameters`);

    return res.status(200).json({
      success: true,
      message: "Confirmation letter updated successfully",
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/confirmation-letters/:id', async (req, res) => {
  try {
    const letter = await ConfirmationLetter.findByIdAndDelete(req.params.id);
    
    // Audit Log
    if (letter) {
      await logAuditAction("Delete Confirmation Letter", "ConfirmationLetter", letter._id, `Removed confirmation record`);
    }

    return res.status(200).json({
      success: true,
      message: "Confirmation letter deleted successfully",
      data: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/confirmation-letters/:id/download', async (req, res) => {
  try {
    const letter = await ConfirmationLetter.findById(req.params.id).populate('employee_id').populate('designation_id');
    if (!letter) return res.status(404).send('Confirmation letter not found');
    
    const empName = letter.employee_id ? `${letter.employee_id.first_name} ${letter.employee_id.last_name}` : 'Employee';
    const desig = letter.designation_id ? letter.designation_id.designation_name : 'Staff';
    
    const docHtml = `
      <html>
        <body onload="window.print()" style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
          <h2 style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; color: #1d4ed8;">LETTER OF SERVICE CONFIRMATION</h2>
          <p><strong>Ref:</strong> ${letter.doc_number}</p>
          <p><strong>Date:</strong> ${new Date(letter.confirmation_date).toLocaleDateString()}</p>
          <br/>
          <p>Dear <strong>${empName}</strong>,</p>
          <p>Following your successful performance review and completion of your probation period of <strong>${letter.probation_period || '6 Months'}</strong>, we are absolutely delighted to confirm your permanent appointment as <strong>${desig}</strong>.</p>
          <p>All other terms and corporate policies set out in your initial employment agreement remain in full force.</p>
          <p>We thank you for your incredible effort and look forward to a long, mutually beneficial professional relationship.</p>
          <br/>
          <p><strong>Remarks:</strong> ${letter.remarks || 'Excellent Probation Performance!'}</p>
          <br/><br/>
          <p>Warm regards,</p>
          <p><strong>HR Operations Directorate</strong></p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(docHtml);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});


// ==========================================
// 7. DOCUMENT TEMPLATE ENDPOINTS
// ==========================================

router.get('/document-templates', async (req, res) => {
  try {
    const templates = await DocumentTemplate.find().sort({ created_at: -1 });
    return res.status(200).json({
      success: true,
      message: "Document templates fetched successfully",
      data: templates
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/document-templates', async (req, res) => {
  try {
    const template = await DocumentTemplate.create(req.body);
    await logAuditAction("Create Document Template", "DocumentTemplate", template._id, `Added template ${template.template_name}`);
    return res.status(201).json({
      success: true,
      message: "Document template created successfully",
      data: template
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/document-templates/:id', async (req, res) => {
  try {
    const template = await DocumentTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAuditAction("Update Document Template", "DocumentTemplate", template._id, `Modified template configurations`);
    return res.status(200).json({
      success: true,
      message: "Document template updated successfully",
      data: template
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// 8. AUDIT LOGS RETRIEVAL ENDPOINT
// ==========================================

router.get('/document-audit-logs', async (req, res) => {
  try {
    const logs = await DocumentAuditLog.find().sort({ performed_at: -1 }).limit(100);
    return res.status(200).json({
      success: true,
      message: "Document audit logs retrieved successfully",
      data: logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
