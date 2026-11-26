import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setUser } from "../../auth/auth.slice";
import {
  connectSocket,
  disconnectSocket,
  onChatCancelled,
  onChatDone,
  onChatError,
  onChatProgress,
  onChatToken,
  onConnect,
  onConnectError,
  onDisconnect,
} from "../services/chat.socket";
import {
  appendRunToken,
  finishRunCancelled,
  finishRunError,
  finishRunSuccess,
  resetChatState,
  setRunStage,
  setSocketStatus,
} from "../chat.slice";

export function useChatSocket() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return undefined;

    dispatch(setSocketStatus("connecting"));
    connectSocket();

    const unsubs = [
      onConnect(() => {
        dispatch(setSocketStatus("connected"));
      }),
      onDisconnect(() => {
        dispatch(setSocketStatus("reconnecting"));
      }),
      onConnectError((err) => {
        const msg = err?.message || "";
        if (/unauth/i.test(msg)) {
          disconnectSocket();
          dispatch(resetChatState());
          dispatch(setUser(null));
          navigate("/login", { replace: true });
          return;
        }
        dispatch(setSocketStatus("reconnecting"));
      }),
      onChatProgress(({ stage }) => {
        if (stage) dispatch(setRunStage(stage));
      }),
      onChatToken(({ text }) => {
        if (typeof text === "string" && text.length > 0) {
          dispatch(appendRunToken(text));
        }
      }),
      onChatDone((payload) => {
        dispatch(finishRunSuccess(payload));
        const newId = payload?.chat?._id;
        if (newId && pathname === "/chat") {
          navigate(`/chat/${newId}`, { replace: true });
        }
      }),
      onChatError((payload) => {
        dispatch(
          finishRunError(
            payload?.message || "Something went wrong, please try again.",
          ),
        );
      }),
      onChatCancelled((payload) => {
        dispatch(finishRunCancelled(payload || {}));
        if (payload?.chatId && pathname === "/chat") {
          navigate(`/chat/${payload.chatId}`, { replace: true });
        }
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, dispatch, navigate, pathname]);

  useEffect(() => {
    return () => {
      disconnectSocket();
      dispatch(setSocketStatus("disconnected"));
    };
  }, [dispatch]);
}

