import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', required: true, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium', required: true },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  if (this.status === 'done') return false;
  return this.dueDate.getTime() < Date.now();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export const Task = mongoose.model('Task', taskSchema);
