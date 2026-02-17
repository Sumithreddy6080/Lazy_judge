import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const judgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  assignedEvents: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(event => 
          ['poster-presentation', 'paper-presentation', 'startup-expo'].includes(event)
        );
      },
      message: 'At least one valid event must be assigned'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

judgeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

judgeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Judge', judgeSchema);
