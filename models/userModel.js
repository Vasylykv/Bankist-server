const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isActivated: {
    type: Boolean,
    default: false,
  },
  activationLink: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 1000,
  },
  movements: [{ date: Date, amount: Number }],
});

// UserSchema.pre('save', function (next) {
//   // this = currently proccessed document
//   // pre save hook// hook it "save" || pre save middleware
//   this.movements.push(
//     { amount: 2000, date: Date.now() },
//     { amount: -1000, date: Date.now() },
//     { amount: 100, date: Date.now() }
//   );
//   // this.movements = Date.now();
//   next();
// });

module.exports = model('User', UserSchema);
