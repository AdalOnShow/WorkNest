import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Search,
  MoreVertical,
  Send,
  Bold,
  Italic,
  Code,
  Smile,
  Paperclip,
  CheckCheck,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/messages')({
  component: MessagesPage,
})

// Mock data
const conversations = [
  {
    id: '1',
    name: 'Nazmul Hossain',
    avatar: null,
    lastMessage:
      'মেসেজ এ সব serverless হবে যাবে, একটু কষ্ট করে ডিটেইলসে ও জানাবেন তাই',
    timestamp: '1 day',
    unread: 0,
    online: true,
    verified: true,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: null,
    lastMessage: "Thanks for the update! Let me know when you're ready.",
    timestamp: '2 hours',
    unread: 3,
    online: true,
    verified: false,
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatar: null,
    lastMessage: 'Can we schedule a call tomorrow?',
    timestamp: '5 hours',
    unread: 0,
    online: false,
    verified: false,
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    avatar: null,
    lastMessage: "Perfect! I'll send you the files.",
    timestamp: '1 day',
    unread: 0,
    online: false,
    verified: true,
  },
]

const messages = [
  {
    id: '1',
    senderId: '1',
    senderName: 'Nazmul Hossain',
    content:
      'মেসেজ এ সব serverless হবে যাবে, একটু কষ্ট করে ডিটেইলসে ও জানাবেন তাই',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    seen: true,
    reactions: [],
  },
  {
    id: '2',
    senderId: '1',
    senderName: 'Nazmul Hossain',
    content:
      'Heh তাই, করতে পারবেনা আপনার যদি শুধু এভাবেই লাগে, তাহলে একটি প্রজেক্টে করতে পারেন। TanStack Start + TanStack Start Server Functions বা API methods দিয়ে করতে পারেন।\n\nDB যেটা ভাল লাগে ব্যবহার করতে পারেন। তবে Cloudflare-এ deploy + manage করার জন্য Wrangler সম্পর্কে একটু জেনে নিতে আপনার জন্য easy হবে।',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    seen: true,
    reactions: [{ emoji: '❤️', count: 1 }],
  },
]

function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0],
  )
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Center Panel - Chat Area */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar
                name={selectedConversation.name}
                image={selectedConversation.avatar}
                size="md"
              />
              {selectedConversation.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-card rounded-full" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-semibold text-foreground">
                  {selectedConversation.name}
                </h2>
                {selectedConversation.verified && (
                  <CheckCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.online
                  ? 'Active about 4 hours ago'
                  : 'Offline'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Date Divider */}
          <div className="flex items-center justify-center">
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-xs text-muted-foreground font-medium">
                Yesterday
              </span>
            </div>
          </div>

          {/* Messages */}
          {messages.map((message, index) => (
            <div key={message.id} className="flex items-start gap-3">
              {/* Avatar */}
              {index === 0 ||
              messages[index - 1].senderId !== message.senderId ? (
                <UserAvatar name={message.senderName} size="sm" />
              ) : (
                <div className="w-8" />
              )}

              {/* Message Content */}
              <div className="flex-1 max-w-2xl">
                {/* Sender name and timestamp */}
                {(index === 0 ||
                  messages[index - 1].senderId !== message.senderId) && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {message.senderName}
                    </span>
                    <CheckCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div className="bg-muted/50 rounded-lg p-3 mb-1">
                  <p className="text-foreground whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>

                {/* Reactions and seen status */}
                <div className="flex items-center gap-2 mt-1">
                  {message.reactions.map((reaction, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full"
                    >
                      <span className="text-sm">{reaction.emoji}</span>
                      <span className="text-xs text-muted-foreground">
                        {reaction.count}
                      </span>
                    </div>
                  ))}
                  {message.seen && (
                    <div className="flex items-center gap-1 text-primary">
                      <Check className="w-3 h-3" />
                      <span className="text-xs">Seen</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="bg-background rounded-lg border border-border">
            <Input
              placeholder={`Message ${selectedConversation.name}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="border-0 focus-visible:ring-0 px-4 py-3"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Code className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>

              <Button size="sm" className="gap-2">
                <span>Send</span>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Conversations List */}
      <div className="w-80 flex flex-col bg-card">
        {/* Search Header */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={cn(
                'w-full p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors border-b border-border',
                selectedConversation.id === conversation.id && 'bg-accent',
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  name={conversation.name}
                  image={conversation.avatar}
                  size="md"
                />
                {conversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-card rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground text-sm">
                      {conversation.name}
                    </span>
                    {conversation.verified && (
                      <CheckCheck className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {conversation.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
