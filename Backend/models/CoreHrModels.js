const mongoose = require('mongoose');

// 1. CANDIDATE SCHEMA
const CandidateSchema = new mongoose.Schema({
  candidate_code: { type: String, required: true, unique: true },
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  full_name: { type: String },
  mobile: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  application_source: { type: mongoose.Schema.Types.ObjectId, ref: 'SourceOfHire' },
  apply_date: { type: Date, default: Date.now },
  state: { type: String },
  candidate_status: {
    type: String,
    enum: ['Applied', 'Interviewed', 'Selected', 'Rejected', 'Joined'],
    default: 'Applied'
  },
  resume_url: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

CandidateSchema.pre('save', function(next) {
  this.full_name = `${this.first_name} ${this.last_name}`;
  next();
});

// 2. OFFER LETTER SCHEMA
const OfferLetterSchema = new mongoose.Schema({
  doc_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  letter_type: {
    type: String,
    enum: ['Employee', 'Candidate'],
    default: 'Candidate'
  },
  template_content: { type: String, required: true },
  compensation_details: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    gross_salary: { type: Number, default: 0 }
  },
  seal_url: { type: String },
  signature_url: { type: String },
  pdf_url: { type: String },
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 3. RELIEVING LETTER SCHEMA
const RelievingLetterSchema = new mongoose.Schema({
  doc_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  relieving_letter_date: { type: Date, default: Date.now },
  last_working_date: { type: Date, required: true },
  joining_date: { type: Date },
  remarks: { type: String },
  pdf_url: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 4. EXPERIENCE LETTER SCHEMA
const ExperienceLetterSchema = new mongoose.Schema({
  doc_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  joining_date: { type: Date },
  experience_letter_date: { type: Date, default: Date.now },
  total_experience: { type: String },
  remarks: { type: String },
  pdf_url: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 5. NOTICE LETTER SCHEMA
const NoticeLetterSchema = new mongoose.Schema({
  doc_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  notice_date: { type: Date, default: Date.now },
  joining_date: { type: Date },
  notice_reason: { type: String },
  pdf_url: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 6. CONFIRMATION LETTER SCHEMA
const ConfirmationLetterSchema = new mongoose.Schema({
  doc_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  offer_letter_date: { type: Date },
  joining_date: { type: Date },
  confirmation_date: { type: Date, default: Date.now },
  probation_period: { type: String },
  remarks: { type: String },
  pdf_url: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 7. DOCUMENT_TEMPLATES COLLECTION
const DocumentTemplateSchema = new mongoose.Schema({
  template_name: { type: String, required: true },
  template_type: {
    type: String,
    enum: [
      'Offer Letter',
      'Relieving Letter',
      'Experience Letter',
      'Notice Letter',
      'Confirmation Letter'
    ],
    required: true
  },
  template_content: { type: String, required: true },
  is_default: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 8. DOCUMENT_ATTACHMENTS COLLECTION
const DocumentAttachmentSchema = new mongoose.Schema({
  module_name: { type: String, required: true },
  reference_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  file_name: { type: String, required: true },
  file_url: { type: String, required: true },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaded_at: { type: Date, default: Date.now }
});

// 9. DOCUMENT_AUDIT_LOGS SCHEMA
const DocumentAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "Create Candidate", "Update Offer Letter"
  module_name: { type: String, required: true },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_at: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = {
  Candidate: mongoose.model('Candidate', CandidateSchema),
  OfferLetter: mongoose.model('OfferLetter', OfferLetterSchema),
  RelievingLetter: mongoose.model('RelievingLetter', RelievingLetterSchema),
  ExperienceLetter: mongoose.model('ExperienceLetter', ExperienceLetterSchema),
  NoticeLetter: mongoose.model('NoticeLetter', NoticeLetterSchema),
  ConfirmationLetter: mongoose.model('ConfirmationLetter', ConfirmationLetterSchema),
  DocumentTemplate: mongoose.model('DocumentTemplate', DocumentTemplateSchema),
  DocumentAttachment: mongoose.model('DocumentAttachment', DocumentAttachmentSchema),
  DocumentAuditLog: mongoose.model('DocumentAuditLog', DocumentAuditLogSchema)
};
