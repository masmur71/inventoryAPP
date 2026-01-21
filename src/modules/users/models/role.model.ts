import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: [{ type: String }], 
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);