import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { orderBy, limit } from "firebase/firestore";
import { Send } from "lucide-react";


export const ChatPanel = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addDocument } = useFirestoreOperations("chatMessages");

  const { data: messages, loading, error } = useFirestoreCollection(
    "chatMessages",
    [orderBy("createdAt", "asc"), limit(50)]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || sending) return;

    setSending(true);
    try {
      await addDocument({
        senderId: user.id,
        message: message.trim(),
        messageType: "text",
        isRead: false,
      });
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Real-time Support</h3>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingSpinner className="h-80" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid="card-chat-panel">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Real-time Support</h3>
      </CardHeader>
      <div className="h-80 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto" data-testid="chat-messages-container">
          {error && (
            <div className="text-center text-red-500" data-testid="text-chat-error">
              Error loading messages: {error}
            </div>
          )}
          
          {!error && messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8" data-testid="text-no-messages">
              No messages yet. Start a conversation!
            </div>
          )}

          {messages.map((msg) => {
            const isCurrentUser = msg.senderId === user?.id;
            const messageTime = msg.createdAt ? 
              new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              }) : '';

            return (
              <div 
                key={msg.id} 
                className={`flex items-start space-x-2 ${isCurrentUser ? 'justify-end' : ''}`}
                data-testid={`message-${msg.id}`}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`rounded-lg p-3 max-w-xs ${
                  isCurrentUser 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className="text-sm" data-testid={`text-message-content-${msg.id}`}>
                    {msg.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                  }`} data-testid={`text-message-time-${msg.id}`}>
                    {messageTime}
                  </p>
                </div>

                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePhoto || undefined} />
                    <AvatarFallback>
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || sending}
              data-testid="button-send-message"
            >
              {sending ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
