import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
      required: function () {
        // text is required only when the message has no files
        return !this.attachments || this.attachments.length === 0;
      },
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
