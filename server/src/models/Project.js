import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sourceType: {
      type: String,
      enum: ['upload', 'github'],
      required: true
    },
    githubUrl: {
      type: String,
      default: ''
    },
    rootPath: {
      type: String,
      required: true
    },
    lastAnalyzedAt: {
      type: Date,
      default: null
    },
    latestReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'ready', 'analyzing', 'failed'],
      default: 'pending'
    },
    fileCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Project', projectSchema);
