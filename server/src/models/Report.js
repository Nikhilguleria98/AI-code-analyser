import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    summary: {
      totalIssues: { type: Number, default: 0 },
      bySeverity: {
        Low: { type: Number, default: 0 },
        Medium: { type: Number, default: 0 },
        High: { type: Number, default: 0 },
        Critical: { type: Number, default: 0 }
      },
      securityScore: { type: Number, default: 100 }
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued'
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Report', reportSchema);
