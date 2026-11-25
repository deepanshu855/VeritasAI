import { describe, test, expect } from "@jest/globals";
import mongoose from "mongoose";
import messageModel from "../src/models/message.model.js";
import fileModel from "../src/models/file.model.js";

const id = () => new mongoose.Types.ObjectId();

describe("Message schema", () => {
  // CHANGED: async test, validate() throws if the record is invalid
  test("accepts a user message with text", async () => {
    const doc = new messageModel({ chat: id(), role: "user", content: "Hello" });
    await doc.validate();
  });

  // CHANGED: rejects + toMatchObject checks which field failed
  test("rejects a message with no text and no attachments", async () => {
    const doc = new messageModel({ chat: id(), role: "user" });
    await expect(doc.validate()).rejects.toMatchObject({
      errors: { content: expect.anything() },
    });
  });

  test("accepts a message with no text but one attachment (file-only)", async () => {
    const doc = new messageModel({
      chat: id(),
      role: "user",
      attachments: [id()],
    });
    await doc.validate();
  });

  test("rejects a role other than user or ai", async () => {
    const doc = new messageModel({ chat: id(), role: "system", content: "Hi" });
    await expect(doc.validate()).rejects.toMatchObject({
      errors: { role: expect.anything() },
    });
  });
});

describe("File schema", () => {
  const validFile = () => ({
    user: id(),
    chat: id(),
    originalName: "notes.pdf",
    mimeType: "application/pdf",
    size: 1024,
    storageKey: "abc123",
    url: "https://example.com/notes.pdf",
  });

  test("accepts a valid file and defaults status to uploaded", async () => {
    const doc = new fileModel(validFile());
    await doc.validate();
    expect(doc.status).toBe("uploaded");
  });

  test("rejects an unknown status", async () => {
    const doc = new fileModel({ ...validFile(), status: "deleted" });
    await expect(doc.validate()).rejects.toMatchObject({
      errors: { status: expect.anything() },
    });
  });
});