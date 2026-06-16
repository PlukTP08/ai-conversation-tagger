import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ROLES } from "../constants";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
