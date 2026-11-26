import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/app.store.js";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
    <ToastContainer />
  </Provider>,
);
