# Veritas AI

An AI-powered chat application built with the MERN stack that combines conversational AI with real-time web search to deliver accurate, context-aware responses. Veritas AI provides a clean chat experience with secure authentication, persistent chat history, and markdown support.

## 🌐 Live Demo

**Application:** https://veritasai-v214.onrender.com/

---

## ✨ Features

- 🤖 AI-powered conversational assistant
- 🌍 Real-time web search powered by Tavily AI
- 💬 Persistent chat history
- 📝 Markdown rendering for AI responses
- 🔐 JWT Authentication
- 🗑️ Delete conversations
- ⚡ Fast and responsive interface
- 🍪 Secure authentication using HTTP-only cookies

---

## 🛠️ Tech Stack

### Frontend

- React
- Redux Toolkit
- React Router
- Axios
- React Markdown
- React Toastify
- Lucide React
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

### AI & Search

- **Mistral AI**
- **Tavily Search API**
- LangChain

---

## 🚀 Core Features

### Authentication

- User Registration
- Secure Login
- Protected Routes

### AI Chat

- Create and manage multiple conversations
- Context-aware AI responses
- Persistent chat history
- Delete chats
- Markdown formatted responses

### Real-Time Web Search

Veritas AI integrates **Tavily Search API** with **Mistral AI** to provide answers using live web information whenever current or factual information is required.

---

## 🔒 Security

- Password hashing with bcrypt
- JWT Authentication
- HTTP-only Cookies
- Input Validation
- Protected API Routes

---

## 📂 Project Structure

```text
VERITAS-AI
│
├── backend
│   ├── public
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middlewares
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── sockets
│   │   ├── validator
│   │   └── app.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── features
│   │   │   ├── auth
│   │   │   │   ├── components
│   │   │   │   ├── hooks
│   │   │   │   ├── pages
│   │   │   │   ├── services
│   │   │   │   ├── styles
│   │   │   │   └── auth.slice.js
│   │   │   │
│   │   │   ├── chat
│   │   │   └── shared
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🎯 Future Improvements

- Support for multiple AI models
- Chat search
- Image generation
- File uploads
- Voice conversations
- Export chats
- Theme customization
- Share conversations

---

## 📖 About

Veritas AI is a modern AI chat application that combines **Mistral AI** with **Tavily Search** to provide intelligent, context-aware, and real-time responses.

The application is built with a focus on simplicity, performance, and security while offering features such as authentication, persistent chat history, markdown support, and real-time web search.

---

## 👨‍💻 Author

**Deepanshu Sharma**

- GitHub: [*Your GitHub Link*](https://github.com/deepanshu855/)
- LinkedIn: *Your LinkedIn Link*https://www.linkedin.com/in/deepanshu-sharma-661572323/

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.