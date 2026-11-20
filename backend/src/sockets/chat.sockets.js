import { runChat } from "../services/chat.graph.js";
import { prepareChat, saveAiMessage } from "../services/chat.service.js";

// Adds the chat events to one connected socket
export const registerChatHandlers = (socket) => {
  const progress = (stage) => socket.emit("chat:progress", { stage });
  const sendToken = (text) => socket.emit("chat:token", { text });

  socket.on("chat:send", async (payload) => {
    // One order at a time per socket
    if (socket.data.busy) {
      return socket.emit("chat:error", {
        message: "A reply is already being written. Please wait.",
      });
    }
    socket.data.busy = true;

    // NEW: the stop button for this run
    const controller = new AbortController();
    socket.data.abort = controller;
    let prepared = null;

    // NEW: tells the client the run was stopped. Nothing is saved for the AI side.
    const cancelledReply = () => {
      const id = prepared?.userChat?._id;
      console.log(
        `[socket] run cancelled socket=${socket.id} chat=${id ?? "none"} (no AI message saved)`,
      );
      if (!socket.disconnected) {
        socket.emit("chat:cancelled", { chatId: id ? String(id) : null });
      }
    };

    try {
      const { message, chatId, fileIds } = payload ?? {};

      progress("preparing");

      // before the AI (same shared code as the HTTP route)
      prepared = await prepareChat({
        userId: socket.data.userId,
        message,
        chatId,
        fileIds,
      });
      const { userChat, messages, runOptions } = prepared;

      // NEW: the cancel may have arrived while we were preparing
      if (controller.signal.aborted) return cancelledReply();

      // the AI. CHANGED: also gets the signal
      const { answer, citations } = await runChat(messages, {
        ...runOptions,
        onProgress: progress,
        onToken: sendToken,
        signal: controller.signal,
      });

      // NEW: a cancel that arrived just as the answer finished
      if (controller.signal.aborted) return cancelledReply();

      // after the AI (from here on, a cancel is ignored)
      await saveAiMessage({ chatId: userChat._id, content: answer });

      socket.emit("chat:done", {
        chat: JSON.parse(JSON.stringify(userChat)),
        title: userChat.title,
        aiResponse: answer,
        citations,
      });
    } catch (error) {
      // NEW: an abort is not an error
      if (controller.signal.aborted) return cancelledReply();

      console.error("[socket] chat:send failed:", error);
      socket.emit("chat:error", {
        message: error.status
          ? error.message
          : "Something went wrong, please try again.",
      });
    } finally {
      socket.data.busy = false;
      socket.data.abort = null; // NEW
    }
  });

  // NEW: the client pressed stop
  socket.on("chat:cancel", () => {
    if (!socket.data.busy) return; // nothing is running
    console.log(`[socket] chat:cancel received socket=${socket.id}`);
    socket.data.abort?.abort();
  });

  // NEW: the client left in the middle of an answer
  socket.on("disconnect", () => {
    if (!socket.data.busy) return;
    console.log(`[socket] client left during a run, cancelling socket=${socket.id}`);
    socket.data.abort?.abort();
  });
};