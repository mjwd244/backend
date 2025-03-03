const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    comments: String,
    createdAt: { type: Date, default: Date.now },
  });
  
  const Report = mongoose.model('Report', reportSchema);