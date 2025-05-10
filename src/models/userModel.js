import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: [true, "Please provide a username"], 
      unique: true, 
      index: true 
    },
    email: { 
      type: String, 
      required: [true, "Please provide an email"], 
      unique: true, 
      index: true 
    },
    password: { 
      type: String, 
      required: [true, "Please provide a password"], 
      index: true 
    },
    isVerified: { 
      type: Boolean, 
      default: false, 
      index: true 
    },
    total_points: { 
      type: Number, 
      default: 0, 
      index: true 
    },
    badges: { 
      type: [
        {
          name: { type: String, index: true },
          imageUrl: { type: String, index: true },
          description: { type: String, index: true },
          awardedAt: { type: Date, default: Date.now, index: true },
        },
      ],
      default: [],
    },
    hosted_quizzes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Quiz", 
      index: true 
    }],
    hasSeenTour: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is new/modified

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const UserNew = mongoose.models.UserNew || mongoose.model("UserNew", userSchema);
export default UserNew;
