const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  /* USER INFO */
  userId: {
    type: mongoose.Schema.Types.Mixed,
    ref:  "User",
    required: function () {
      // allow null for system or error events
      return !["system_activity", "error_occurred"].includes(this.type);
    }
  },
  userEmail: String,
  userName:  String,
  userRole:  { type:String, enum:["student","instructor","admin","system"], default:"student" },

  /* CLASSIFICATION */
  type:   { type:String, required:true, enum:[ /* …list unchanged… */ ] },
  action: String,
  message:{ type:String, required:true },

  /* DETAILS (unchanged) */
  details: {
    productId:  { type: mongoose.Schema.Types.Mixed, ref:"Product" },
    courseId:   { type: mongoose.Schema.Types.Mixed, ref:"Course"  },
    orderId:    { type: mongoose.Schema.Types.Mixed, ref:"Order"   },
    categoryId: { type: mongoose.Schema.Types.Mixed, ref:"Category"},
    searchQuery:String,
    amount:     Number,
    previousValue:String,
    newValue:   String,
    metadata:   mongoose.Schema.Types.Mixed,
    errorDetails:{
      errorMessage:String,
      stackTrace: String,
      errorCode:  String
    }
  },

  /* META */
  value:String,
  ipAddress:String,
  userAgent:String,
  severity:{ type:String, enum:["low","medium","high","critical"], default:"low" },
  priority:{ type:String, enum:["normal","high","urgent"], default:"normal" },
  timestamp:{ type:Date, default:Date.now },
  isRead:    { type:Boolean, default:false },
  isArchived:{ type:Boolean, default:false }
},{ timestamps:true });

/* Indexes (unchanged) */

/* Pre-save: default message */
ActivitySchema.pre("save", function (next) {
  if (!this.message) this.message = `${this.type.replace(/_/g," ")} activity`;
  next();
});

/* Static + instance helpers (unchanged) */

module.exports = mongoose.model("Activity", ActivitySchema);
