const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true
    },
    planName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },  
    renewalDate: {
        type: Date,
        required: true
    },
    subType: {
        type: String,
        enum: ['Trail', 'Weekly', 'Monthly', 'Yearly'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Cancelled'],    
        required: true
    },
    notes: {
        type: String
    },
    owner: {            
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;