import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import { orderBy, limit } from "firebase/firestore";
import { Send, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Chat() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { addDocument } = useFirestoreOperations("chatMessages");

  const { data: messages, loading, error } = useFirestoreCollection(
    "chatMessages",
    [orderBy("createdAt", "desc"), limit(100)]
  );

  // Group messages by booking ID
  const messagesByBooking = messages.reduce((acc, msg) => {
    const bookingId = msg.bookingId || "general";
    if (!acc[bookingId]) {
      acc[bookingId] = [];
    }
    acc[bookingId].push(msg);
    return acc;
  }, {});

  // Get chat list (unique booking IDs)
  const chatList = Object.keys(messagesByBooking).map(bookingId => ({
    id: bookingId,
    lastMessage: messagesByBooking[bookingId][0],
    unreadCount: messagesByBooking[bookingId].filter(m => !m.isRead && m.senderId !== user?.id).length,
    messageCount: messagesByBooking[bookingId].length
  }));

  const selectedMessages = selectedChat ? messagesByBooking[selectedChat]?.reverse() || [] : [];

  const handleSendMessage = async () => {
    if (!message.trim() || !user || sending || !selectedChat) return;

    setSending(true);
    try {
      await addDocument({
        bookingId: selectedChat === "general" ? null : selectedChat,
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
      <Layout title="Real-time Chat">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Real-time Chat">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] animate-in fade-in duration-300">
        {/* Chat List */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Active Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-4 text-red-500 text-sm" data-testid="text-chat-error">
                Error loading chats: {error}
              </div>
            )}
            
            {!error && chatList.length === 0 && (
              <div className="p-8 text-center text-gray-500" data-testid="text-no-chats">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No chat messages yet</p>
              </div>
            )}

            {!error && chatList.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {chatList.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      selectedChat === chat.id && "bg-blue-50 dark:bg-blue-950 border-r-2 border-primary"
                    )}
                    onClick={() => setSelectedChat(chat.id)}
                    data-testid={`chat-item-${chat.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {chat.id === "general" ? "General Chat" : `Booking #${chat.id.slice(0, 8)}`}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                          {chat.lastMessage?.message || "No messages"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {chat.messageCount} messages
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2" data-testid={`badge-unread-${chat.id}`}>
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2 border-gray-100 dark:border-gray-800 flex flex-col">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle>
              {selectedChat 
                ? selectedChat === "general" 
                  ? "General Chat" 
                  : `Booking #${selectedChat.slice(0, 8)}`
                : "Select a chat"
              }
            </CardTitle>
          </CardHeader>

          {selectedChat ? (
            <>
              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto" data-testid="chat-messages-container">
                {selectedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500" data-testid="text-no-messages">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages in this chat</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedMessages.map((msg) => {
                      const isCurrentUser = msg.senderId === user?.id;
                      const messageTime = msg.createdAt 
                        ? new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })
                        : '';

                      return (
                        <div 
                          key={msg.id} 
                          className={`flex items-start space-x-2 ${isCurrentUser ? 'justify-end' : ''}`}
                          data-testid={`message-${msg.id}`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {msg.senderId?.slice(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                            isCurrentUser 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}>
                            <p className="text-sm" data-testid={`text-message-content-${msg.id}`}>
                              {msg.message}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
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
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500" data-testid="text-select-chat">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Real-time Chat System</h3>
                <p>Select a chat from the sidebar to start messaging</p>
                <p className="text-sm mt-2">Messages are synced in real-time across all devices</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}