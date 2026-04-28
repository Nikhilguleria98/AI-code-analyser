import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    file: {
      type: String,
      required: true
    },
    line: {
      type: Number,
      default: 1
    },
    issue: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    fixSuggestion: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      enum: ['eslint', 'semgrep', 'ai'],
      required: true
    },
    ruleId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

issueSchema.index({ report: 1, file: 1, line: 1, issue: 1, source: 1 }, { unique: true });

export default mongoose.model('Issue', issueSchema);
