import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";

interface Message {
  _id?: string;
  interest: string;
  sender: string | { _id: string; name: string };
  content: string;
  createdAt?: string;
}

const ChatRoom = () => {
  const { interestId } = useParams<{ interestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistoricalMessages();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistoricalMessages = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/interests/${interestId}/messages`);
      setMessages(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You are not authorized to access this chat room.");
      } else {
        setError(err.response?.data?.error || "Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const SOCKET_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : "http://localhost:5001";

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketError(null);
      socket.emit("join_room", { interestId });
    });

    socket.on("connect_error", (err) => {
      setSocketError("Unable to connect to chat server.");
      console.error("Socket connect_error:", err.message);
    });

    socket.on("room_error", (data: { message: string }) => {
      setSocketError(data.message);
      console.error("Room error:", data.message);
    });

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    socket.on("error", (err) => {
      setSocketError(err.message || "Socket error occurred");
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !user) return;

    const messageData = {
      interestId,
      content: newMessage.trim(),
    };

    // Emit to socket
    socketRef.current.emit("send_message", messageData);

    // Optimistically update local UI (optional, backend broadcasts to sender too usually,
    // but to avoid duplication we wait for receive_message or assume it comes back.
    // Given typical Socket.io setups, receive_message is broadcast to everyone in the room.
    // If backend uses io.to().emit, sender receives it. If backend uses socket.to().emit, 
    // sender doesn't receive it. Assuming standard setup where sender also receives it.
    // If it doesn't appear, we can append it here. Let's append optimistically and filter dupes by ID 
    // if needed, but since we don't have the _id yet, we rely on the broadcast for simplicity.
    
    setNewMessage("");
  };

  const isSenderMe = (sender: string | { _id: string; name: string }) => {
    const senderId = typeof sender === "string" ? sender : sender._id;
    return senderId === user?._id;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-sm rounded-lg border border-red-200 text-center mt-10">
        <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 h-[80vh] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            &larr; Back
          </button>
          <h2 className="font-bold text-gray-800 text-lg">Chat Room</h2>
        </div>
        {socketError && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
            {socketError}
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-auto">
            <p>No messages yet.</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const me = isSenderMe(msg.sender);
            const senderName = typeof msg.sender === "object" ? msg.sender.name : (me ? "You" : "Other");
            
            return (
              <div key={msg._id || idx} className={`flex flex-col max-w-[75%] ${me ? 'self-end' : 'self-start'}`}>
                {!me && <span className="text-xs text-gray-500 ml-1 mb-1">{senderName}</span>}
                <div 
                  className={`px-4 py-2 rounded-2xl ${
                    me 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className={`text-[10px] text-gray-400 mt-1 ${me ? 'text-right mr-1' : 'ml-1'}`}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-gray-50 outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !!socketError}
            className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
