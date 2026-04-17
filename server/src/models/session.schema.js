import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      // Every possible event type that gets recorded
      enum: [
        "operation", // keystroke / edit
        "cursor", // cursor position change
        "language", // language switched
        "run", // code executed
        "join", // user joined
        "leave", // user left
      ],
      required: true,
    },
    data: mongoose.Schema.Types.Mixed, // event payload
    t: { type: Number, required: true }, // ms from session start
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    roomName: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [
      {
        userId: String,
        name: String,
        color: String,
      },
    ],
    events: [eventSchema],
    finalCode: String, // snapshot of code at end
    language: String,
    duration: Number, // total duration in ms
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true },
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
