const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    acton:{
        type: String,
        required: true,
        enum:['CREATED_TASK', 'CREATED_PROJECT' , 'UPDATED_TASK' , 'DELETED_TASK' , 'DELETED_PROJECT','ADDED_COMMENT']
    },
    userId: {
        type : Number,
        required : true
    },
    entityId: {
        type : Number,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);