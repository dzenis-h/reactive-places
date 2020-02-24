const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secret = require("../config/config_prod").SECRET;

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }]
});

userSchema.plugin(uniqueValidator);

userSchema.pre("save", async function(next) {
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.log(error);
  }
});

userSchema.methods.isMatch = async function(enteredPassword) {
  return await bcrypt.compare(this.password, enteredPassword);
};

userSchema.methods.signToken = function() {
  return jwt.sign({ id: this._id }, secret, {
    expiresIn: "1d"
  });
};

module.exports = mongoose.model("User", userSchema);
