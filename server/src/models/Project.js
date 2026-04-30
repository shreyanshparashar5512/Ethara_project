import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member', required: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [projectMemberSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

projectSchema.methods.hasUser = function (userId) {
  const uid = String(userId);
  if (String(this.owner) === uid) return true;
  return this.members.some((m) => String(m.user) === uid);
};

projectSchema.methods.getUserRole = function (userId) {
  const uid = String(userId);
  if (String(this.owner) === uid) return 'owner';
  const m = this.members.find((m) => String(m.user) === uid);
  return m ? m.role : null;
};

export const Project = mongoose.model('Project', projectSchema);
