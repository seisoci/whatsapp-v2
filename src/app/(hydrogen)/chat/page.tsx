'use client';

import { Avatar, Button, Input, ActionIcon, Drawer, Textarea, Popover } from 'rizzui';
import {
  PiPaperclip,
  PiPhone,
  PiSmiley,
  PiVideo,
  PiArrowLeft,
  PiImage,
  PiPaperPlaneTilt,
  PiEnvelope,
  PiMapPin,
  PiCalendar,
  PiUser,
  PiX,
  PiShareNetwork,
  PiTrash,
  PiExport,
  PiWarning,
  PiFolder,
  PiFileText,
  PiFilePdf,
  PiStar,
  PiGlobe,
  PiLightning,
  PiCheck,
  PiChecks,
  PiXCircle,
  PiPlayCircle,
  PiDownload,
  PiFileDoc,
  PiPause,
  PiArrowsOut,
  PiHeadset,
} from 'react-icons/pi';
import React, { useState, useRef } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

const contacts = [
  {
    id: 1,
    name: 'Michell Flintoff',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    lastMessage: 'You: Yesterday was great...',
    time: '15 mins',
    online: true,
    unread: 0,
    agentName: 'John Doe',
    favorite: true,
  },
  {
    id: 2,
    name: 'Bianca Anderson',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastMessage: 'Nice looking dress you...',
    time: '30 mins',
    online: false,
    unread: 2,
    agentName: 'Sarah Smith',
    favorite: false,
  },
  {
    id: 3,
    name: 'Andrew Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    lastMessage: 'Sent a photo',
    time: '2 hours',
    online: true,
    unread: 0,
    agentName: 'John Doe',
    favorite: true,
  },
  {
    id: 4,
    name: 'Daisy Wilson',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    lastMessage: 'Lorem ipsum text sud...',
    time: '5 days',
    online: true,
    unread: 0,
    agentName: 'Mike Ross',
    favorite: false,
  },
];

const messages = [
  {
    id: 1,
    sender: 'Andrew Johnson',
    message: "If I don't like something, I'll stay away from it.",
    time: '2 hours ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    type: 'text',
  },
  {
    id: 2,
    sender: 'You',
    message: "If I don't like something, I'll stay away from it.",
    time: '2 hours ago',
    isOwn: true,
    status: 'sent',
    type: 'text',
  },
  {
    id: 3,
    sender: 'Andrew Johnson',
    type: 'image',
    imageUrl: 'https://picsum.photos/400/300',
    message: 'Check out this photo!',
    time: '1 hour ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 4,
    sender: 'You',
    type: 'document',
    fileName: 'Proposal_Project_2024.pdf',
    fileSize: '2.4 MB',
    time: '1 hour ago',
    isOwn: true,
    status: 'delivered',
  },
  {
    id: 5,
    sender: 'Andrew Johnson',
    type: 'audio',
    duration: '00:45',
    time: '45 mins ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 6,
    sender: 'You',
    type: 'location',
    locationName: 'Starbucks Coffee',
    locationAddress: '123 Main Street, Downtown',
    time: '30 mins ago',
    isOwn: true,
    status: 'read',
  },
  {
    id: 7,
    sender: 'Andrew Johnson',
    type: 'contact',
    contactName: 'John Doe',
    contactPhone: '+1 234 567 8900',
    time: '20 mins ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 8,
    sender: 'You',
    type: 'video',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://picsum.photos/400/300?random=video',
    duration: '2:15',
    time: '15 mins ago',
    isOwn: true,
    status: 'read',
  },
  {
    id: 9,
    sender: 'You',
    message: 'They got there early, and they got really good seats.',
    time: '10 mins ago',
    isOwn: true,
    status: 'read',
    type: 'text',
  },
  {
    id: 10,
    sender: 'Andrew Johnson',
    message: 'That sounds great! I wish I could have joined you.',
    time: '8 mins ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    type: 'text',
  },
  {
    id: 11,
    sender: 'You',
    message: 'Next time for sure!',
    time: '7 mins ago',
    isOwn: true,
    status: 'read',
    type: 'text',
  },
  {
    id: 12,
    sender: 'Andrew Johnson',
    message: 'Looking forward to it!',
    time: '6 mins ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    type: 'text',
  },
  {
    id: 13,
    sender: 'You',
    type: 'image',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    message: 'Here is another photo from yesterday',
    time: '5 mins ago',
    isOwn: true,
    status: 'read',
  },
  {
    id: 14,
    sender: 'Andrew Johnson',
    message: 'Wow, beautiful shot!',
    time: '4 mins ago',
    isOwn: false,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    type: 'text',
  },
  {
    id: 15,
    sender: 'You',
    message: 'Thanks! I really enjoyed the view.',
    time: '3 mins ago',
    isOwn: true,
    status: 'read',
    type: 'text',
  },
];

const defaultEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
  '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖',
  '🔥', '⭐', '✨', '💫', '💥', '💯', '✅', '❌',
];

const quickReplies = [
  { id: 1, text: 'Saya berminat dengan potongan harga 10% yang ditawarkan', value: 'DISC10' },
  { id: 2, text: 'Apakah bisa mendapatkan potongan harga 20% untuk pembelian ini?', value: 'DISC20' },
  { id: 3, text: 'Saya tertarik dengan penawaran diskon 30%, mohon info lebih lanjut', value: 'DISC30' },
  { id: 4, text: 'Bisakah memberikan potongan harga hingga 50% untuk transaksi ini?', value: 'DISC50' },
  { id: 5, text: 'Saya akan melakukan pembayaran secara penuh sekarang', value: 'FULL' },
  { id: 6, text: 'Apakah bisa melakukan pembayaran bertahap atau cicilan?', value: 'PARTIAL' },
  { id: 7, text: 'Terima kasih banyak atas informasi dan bantuannya', value: 'Thanks' },
  { id: 8, text: 'Iya benar, saya setuju dengan penawaran tersebut', value: 'Yes' },
  { id: 9, text: 'Tidak, terima kasih. Saya pertimbangkan dulu', value: 'No' },
  { id: 10, text: 'Mohon kirimkan informasi lengkap mengenai produk dan harga', value: 'MoreInfo' },
  { id: 11, text: 'Tolong hubungi saya kembali nanti, saya sedang sibuk sekarang', value: 'CallLater' },
  { id: 12, text: 'Boleh minta dikirimkan katalog produk lengkap beserta harganya?', value: 'SendCatalog' },
];

export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorite'>('all');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<any[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<number | null>(null);
  const [displayedMessages, setDisplayedMessages] = useState(messages);
  const [hasMore, setHasMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickReplyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);

  const handleContactClick = (contact: typeof contacts[0]) => {
    setSelectedContact(contact);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() || selectedImage) {
      const newMessage = {
        id: Date.now(),
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        status: 'sent',
        type: selectedImage ? 'image' : 'text',
        ...(selectedImage ? { imageUrl: selectedImage } : {}),
        message: messageInput,
      };

      // @ts-ignore
      setDisplayedMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
      setSelectedImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleImageAttach = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('File attached:', files[0].name);
      // Handle file upload
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleQuickReply = (text: string) => {
    setMessageInput(text);
    setShowQuickReplies(false);
  };

  const toggleQuickReplies = () => {
    setShowQuickReplies((prev) => !prev);
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxSlides([{ src: imageUrl }]);
    setLightboxOpen(true);
  };

  const handleVideoClick = (videoUrl: string) => {
    setLightboxSlides([
      {
        type: "video",
        width: 1280,
        height: 720,
        sources: [
          {
            src: videoUrl,
            type: "video/mp4"
          }
        ]
      }
    ]);
    setLightboxOpen(true);
  };

  const handleLocationClick = (locationName: string, locationAddress: string) => {
    const searchQuery = encodeURIComponent(`${locationName}, ${locationAddress}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
  };

  const handleDownload = (fileName: string) => {
    // Simulasi download. Di production, gunakan URL file yang valid.
    console.log(`Downloading ${fileName}...`);
    alert(`Downloading ${fileName}...`);
  };

  const toggleAudioPlay = (audioId: number) => {
    if (isPlayingAudio === audioId) {
      setIsPlayingAudio(null);
    } else {
      setIsPlayingAudio(audioId);
    }
  };

  const handleLoadMore = () => {
    const currentLength = displayedMessages.length;
    const nextMessages = messages.slice(0, currentLength + 5);
    setDisplayedMessages(nextMessages);
    setHasMore(nextMessages.length < messages.length);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteMessage = (id: number) => {
    setDisplayedMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleClearChat = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua pesan?')) {
      setDisplayedMessages([]);
      setShowProfileDrawer(false);
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [displayedMessages]);

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        quickReplyRef.current &&
        !quickReplyRef.current.contains(event.target as Node)
      ) {
        setShowQuickReplies(false);
      }
    };

    if (showEmojiPicker || showQuickReplies) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showQuickReplies]);

  return (
    <>
      <div className="@container">
        <div className="grid grid-cols-12 gap-0 rounded-lg border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Sidebar - Contact List */}
          <div
            className={`col-span-12 border-r border-gray-200 @lg:col-span-4 @xl:col-span-3 h-full min-h-0 ${
              showChat ? 'hidden @lg:block' : 'block'
            }`}
          >
            <div className="flex h-full flex-col">
              {/* User Profile Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src="https://randomuser.me/api/portraits/men/1.jpg"
                      name="Mathew Anderson"
                      className="h-12 w-12"
                    />
                    <div>
                      <h6 className="text-sm font-semibold">Mathew Anderson</h6>
                      <p className="text-xs text-gray-500">Designer</p>
                    </div>
                  </div>
                </div>
                <Input
                  type="search"
                  placeholder="Search Contact"
                  className="w-full"
                />
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex gap-2 border-b border-gray-200 px-4 py-3">
                  <Button
                    size="sm"
                    variant={chatFilter === 'all' ? 'solid' : 'outline'}
                    onClick={() => setChatFilter('all')}
                    className="flex-1"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={chatFilter === 'unread' ? 'solid' : 'outline'}
                    onClick={() => setChatFilter('unread')}
                    className="flex-1"
                  >
                    Unread
                  </Button>
                  <Button
                    size="sm"
                    variant={chatFilter === 'favorite' ? 'solid' : 'outline'}
                    onClick={() => setChatFilter('favorite')}
                    className="flex-1"
                  >
                    Favorite
                  </Button>
                </div>
                {contacts
                  .filter((contact) => {
                    if (chatFilter === 'unread') return contact.unread > 0;
                    if (chatFilter === 'favorite') return contact.favorite;
                    return true;
                  })
                  .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedContact?.id === contact.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Avatar
                      src={contact.avatar}
                      name={contact.name}
                      className="h-12 w-12"
                    />
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-semibold truncate">{contact.name}</h6>
                      <p className="truncate text-xs text-gray-600">
                        {contact.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">{contact.time}</span>
                      {contact.unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                          {contact.unread}
                        </span>
                      )}
                      {contact.agentName && (
                        <span className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          <PiHeadset className="h-3 w-3" />
                          {contact.agentName}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`col-span-12 @lg:col-span-8 @xl:col-span-9 h-full min-h-0 ${
              !showChat && !selectedContact ? 'hidden @lg:flex' : 'flex'
            }`}
          >
            {selectedContact ? (
              <div className="flex h-full w-full flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 flex-shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                      variant="text"
                      className="@lg:hidden p-0 h-auto hover:bg-transparent"
                      onClick={handleBackToList}
                    >
                      <PiArrowLeft className="h-6 w-6" />
                    </Button>
                    <button
                      onClick={() => setShowProfileDrawer(true)}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                    >
                      <Avatar
                        src={selectedContact.avatar}
                        name={selectedContact.name}
                        className="h-10 w-10"
                      />
                    </button>
                    <div>
                      <h6 className="text-sm font-semibold">{selectedContact.name}</h6>
                      <p className="text-xs text-gray-500">
                        {selectedContact.online ? 'Online' : 'Away'}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAgentActive ? 'solid' : 'outline'}
                    size="sm"
                    onClick={() => setIsAgentActive(!isAgentActive)}
                    className="gap-2"
                  >
                    <PiHeadset className="h-5 w-5" />
                    <span>{isAgentActive ? 'Agent Active' : 'Agent'}</span>
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-4">
                  {hasMore && (
                    <div className="flex justify-center mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadMore}
                        className="gap-2"
                      >
                        Load More Messages
                      </Button>
                    </div>
                  )}
                  {displayedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`group flex items-start gap-3 ${
                        msg.isOwn ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {!msg.isOwn && (
                        <Avatar
                          src={msg.avatar}
                          name={msg.sender}
                          className="h-8 w-8"
                        />
                      )}
                      <div
                        className={`max-w-md ${msg.isOwn ? 'items-end' : 'items-start'}`}
                      >
                        <p className="mb-1 text-xs text-gray-500">
                          {msg.sender}, {msg.time}
                        </p>

                        {/* Text Message */}
                        {msg.type === 'text' && (
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              msg.isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-end gap-2">
                              <p className="text-sm flex-1">{msg.message}</p>
                              {msg.isOwn && (
                                <span className="flex-shrink-0">
                                  {msg.status === 'sent' && (
                                    <PiCheck className="h-4 w-4 text-white" />
                                  )}
                                  {msg.status === 'delivered' && (
                                    <PiChecks className="h-4 w-4 text-white" />
                                  )}
                                  {msg.status === 'read' && (
                                    <PiChecks className="h-4 w-4 text-blue-200" />
                                  )}
                                  {msg.status === 'failed' && (
                                    <PiXCircle className="h-4 w-4 text-red-300" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Image Message */}
                        {msg.type === 'image' && (
                          <div className={`overflow-hidden rounded-lg ${msg.message ? (msg.isOwn ? 'bg-blue-500' : 'bg-gray-100') : 'relative'}`}>
                            <div className="relative group cursor-pointer" onClick={() => handleImageClick(msg.imageUrl!)}>
                              <img
                                src={msg.imageUrl}
                                alt="Shared image"
                                className="h-auto w-full max-w-sm object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <PiArrowsOut className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {!msg.message && msg.isOwn && (
                                <div className="absolute bottom-1 right-1 rounded bg-black/40 px-1.5 py-0.5 backdrop-blur-md">
                                  <span className="flex items-center">
                                    {msg.status === 'sent' && <PiCheck className="h-3.5 w-3.5 text-white" />}
                                    {msg.status === 'delivered' && <PiChecks className="h-3.5 w-3.5 text-white" />}
                                    {msg.status === 'read' && <PiChecks className="h-3.5 w-3.5 text-blue-200" />}
                                    {msg.status === 'failed' && <PiXCircle className="h-3.5 w-3.5 text-red-300" />}
                                  </span>
                                </div>
                              )}
                            </div>
                            {msg.message && (
                              <div
                                className={`px-3 py-2 ${
                                  msg.isOwn
                                    ? 'text-white'
                                    : 'text-gray-900'
                                }`}
                              >
                                <div className="flex items-end gap-2">
                                  <p className="text-sm flex-1">{msg.message}</p>
                                  {msg.isOwn && (
                                    <span className="flex-shrink-0">
                                      {msg.status === 'sent' && <PiCheck className="h-4 w-4 text-white" />}
                                      {msg.status === 'delivered' && <PiChecks className="h-4 w-4 text-white" />}
                                      {msg.status === 'read' && <PiChecks className="h-4 w-4 text-blue-200" />}
                                      {msg.status === 'failed' && <PiXCircle className="h-4 w-4 text-red-300" />}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Document Message */}
                        {msg.type === 'document' && (
                          <div
                            className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity ${
                              msg.isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                            onClick={() => handleDownload(msg.fileName!)}
                          >
                            <div className={`rounded-lg p-2 ${msg.isOwn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <PiFilePdf className={`h-6 w-6 ${msg.isOwn ? 'text-white' : 'text-red-500'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{msg.fileName}</p>
                              <p className={`text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.fileSize}
                              </p>
                            </div>
                            <PiDownload className={`h-5 w-5 ${msg.isOwn ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                        )}

                        {/* Audio Message */}
                        {msg.type === 'audio' && (
                          <div
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer ${
                              msg.isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                            onClick={() => toggleAudioPlay(msg.id)}
                          >
                            {isPlayingAudio === msg.id ? (
                              <PiPause className={`h-8 w-8 ${msg.isOwn ? 'text-white' : 'text-blue-500'}`} />
                            ) : (
                              <PiPlayCircle className={`h-8 w-8 ${msg.isOwn ? 'text-white' : 'text-blue-500'}`} />
                            )}
                            <div className="flex-1">
                              <div className={`h-1 w-full rounded-full ${msg.isOwn ? 'bg-blue-300' : 'bg-gray-300'}`}>
                                <div className={`h-1 rounded-full transition-all duration-300 ${msg.isOwn ? 'bg-white' : 'bg-blue-500'} ${isPlayingAudio === msg.id ? 'w-2/3' : 'w-1/3'}`} />
                              </div>
                              <p className={`mt-1 text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.duration}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Location Message */}
                        {msg.type === 'location' && (
                          <div
                            className="overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleLocationClick(msg.locationName!, msg.locationAddress!)}
                          >
                            <div className="h-32 w-full bg-gradient-to-br from-blue-400 to-blue-600 relative">
                              <PiMapPin className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white" />
                            </div>
                            <div
                              className={`p-3 ${
                                msg.isOwn
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm font-medium">{msg.locationName}</p>
                              <p className={`text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.locationAddress}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Video Message */}
                        {msg.type === 'video' && (
                          <div className="overflow-hidden rounded-lg">
                            <div
                              className="relative group cursor-pointer"
                              onClick={() => handleVideoClick(msg.videoUrl!)}
                            >
                              <img
                                src={msg.thumbnail}
                                alt="Video thumbnail"
                                className="h-auto w-full max-w-sm rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                  <PiPlayCircle className="h-16 w-16 text-white" />
                                  <span className="mt-2 text-sm text-white font-medium">{msg.duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contact Message */}
                        {msg.type === 'contact' && (
                          <div
                            className={`flex items-center gap-3 rounded-lg p-3 ${
                              msg.isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className={`rounded-full p-2 ${msg.isOwn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <PiUser className={`h-6 w-6 ${msg.isOwn ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{msg.contactName}</p>
                              <p className={`text-xs ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.contactPhone}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status check for non-text messages */}
                        {msg.isOwn && msg.type !== 'text' && msg.type !== 'image' && (
                          <div className="mt-1 flex justify-end">
                            <span className="flex-shrink-0">
                              {msg.status === 'sent' && (
                                <PiCheck className="h-4 w-4 text-gray-500" />
                              )}
                              {msg.status === 'delivered' && (
                                <PiChecks className="h-4 w-4 text-gray-500" />
                              )}
                              {msg.status === 'read' && (
                                <PiChecks className="h-4 w-4 text-blue-500" />
                              )}
                              {msg.status === 'failed' && (
                                <PiXCircle className="h-4 w-4 text-red-500" />
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <Popover placement="left">
                        <Popover.Trigger>
                          <ActionIcon
                            variant="text"
                            size="sm"
                            className="opacity-0 transition-opacity group-hover:opacity-100 self-center text-gray-400 hover:text-red-500"
                          >
                            <PiTrash className="h-4 w-4" />
                          </ActionIcon>
                        </Popover.Trigger>
                        <Popover.Content>
                          {({ setOpen }) => (
                            <div className="w-48 p-1">
                              <p className="mb-3 text-sm text-gray-700">Hapus pesan ini?</p>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-7" onClick={() => setOpen(false)}>
                                  Batal
                                </Button>
                                <Button size="sm" className="h-7 bg-red-500 text-white hover:bg-red-600" onClick={() => { handleDeleteMessage(msg.id); setOpen(false); }}>
                                  Hapus
                                </Button>
                              </div>
                            </div>
                          )}
                        </Popover.Content>
                      </Popover>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 flex-shrink-0">
                <div className="p-4">
                {selectedImage && (
                  <div className="mb-3 flex items-start gap-2">
                    <div className="relative group">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors"
                      >
                        <PiX className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="*/*"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <div className="relative" ref={quickReplyRef}>
                    <ActionIcon
                      variant="text"
                      size="lg"
                      className="hover:bg-gray-100"
                      onClick={toggleQuickReplies}
                      title="Quick Replies"
                    >
                      <PiLightning className="h-5 w-5" />
                    </ActionIcon>

                    {/* Quick Reply Popup */}
                    {showQuickReplies && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-200 px-4 py-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Quick Replies
                          </h4>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          <ul className="divide-y divide-gray-100">
                            {quickReplies.map((reply) => (
                              <li key={reply.id}>
                                <button
                                  onClick={() => handleQuickReply(reply.text)}
                                  className="flex w-full items-center px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <span>{reply.text}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <ActionIcon
                    variant="text"
                    size="lg"
                    className="hover:bg-gray-100"
                    onClick={handleImageAttach}
                    title="Attach Image"
                  >
                    <PiImage className="h-5 w-5" />
                  </ActionIcon>
                  <ActionIcon
                    variant="text"
                    size="lg"
                    className="hover:bg-gray-100"
                    onClick={handleFileAttach}
                    title="Attach File"
                  >
                    <PiPaperclip className="h-5 w-5" />
                  </ActionIcon>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 max-h-[150px] min-h-[42px] !resize-none overflow-y-auto [&_textarea]:!resize-none"
                    rows={1}
                  />
                  <div className="relative" ref={emojiPickerRef}>
                    <ActionIcon
                      variant="text"
                      size="lg"
                      className="hover:bg-gray-100"
                      onClick={toggleEmojiPicker}
                      title="Emoji"
                    >
                      <PiSmiley className="h-5 w-5" />
                    </ActionIcon>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                        <div className="mb-2 border-b border-gray-200 pb-2">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Choose an emoji
                          </h4>
                        </div>
                        <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto">
                          {defaultEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiClick(emoji)}
                              className="flex h-10 w-10 items-center justify-center rounded hover:bg-gray-100 text-2xl transition-colors"
                              type="button"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() && !selectedImage}
                    className="gap-1"
                  >
                    <PiPaperPlaneTilt className="h-4 w-4" />
                    <span className="hidden @sm:inline">Send</span>
                  </Button>
                </div>
                </div>
                {isAgentActive && (
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                    <span>Agent: <span className="font-semibold text-gray-900">John Doe</span></span>
                    <span className="flex items-center gap-1.5 text-green-600"><span className="h-2 w-2 rounded-full bg-green-500" /> Active</span>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div className="hidden @lg:flex h-full w-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mb-4 text-gray-400">
                    <PiSmiley className="mx-auto h-20 w-20" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    Select a chat to start messaging
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a contact from the list to begin conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Drawer */}
      <Drawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        placement="right"
        size="sm"
      >
        <div className="flex h-full flex-col bg-gray-50">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">Personal Information</p>
            </div>
            <Button
              variant="text"
              className="h-9 w-9 p-0"
              onClick={() => setShowProfileDrawer(false)}
            >
              <PiX className="h-5 w-5" />
            </Button>
          </div>

          {/* Profile Content - Full Scroll */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {/* Profile Header */}
            <div className="mb-4 rounded-lg bg-white p-6 text-center">
              <div className="relative mb-4 inline-block">
                <Avatar
                  src={selectedContact?.avatar}
                  name={selectedContact?.name || ''}
                  className="h-24 w-24 shadow-lg"
                />
              </div>
              <h3 className="mb-1 text-xl font-bold text-gray-900">
                {selectedContact?.name}
              </h3>
              <p className="text-sm text-gray-500">Add Description</p>

              {/* Social Media Links */}
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="solid" className="h-9 w-9 rounded-full bg-red-500 p-0 hover:bg-red-600">
                  <PiGlobe className="h-4 w-4" />
                </Button>
                <Button variant="solid" className="h-9 w-9 rounded-full bg-blue-400 p-0 hover:bg-blue-500">
                  <PiShareNetwork className="h-4 w-4" />
                </Button>
                <Button variant="solid" className="h-9 w-9 rounded-full bg-blue-600 p-0 hover:bg-blue-700">
                  <PiUser className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {/* Shared Documents */}
              <div className="rounded-lg bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Shared Document
                  </h4>
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                    3
                  </span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                    <PiFolder className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-gray-700">Simple_practice_project.zip</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                    <PiFileText className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">Word_Map.jpg</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                    <PiFilePdf className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-gray-700">Latest_Design_portfolio.pdf</span>
                  </li>
                </ul>
              </div>

              {/* Shared Media */}
              <div className="rounded-lg bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Shared Media</h4>
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                    6
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500">22/03/2024</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200"
                      >
                        <img
                          src={`https://picsum.photos/200/200?random=${i}`}
                          alt={`Media ${i}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Starred Messages */}
              <div className="rounded-lg bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Starred Messages
                  </h4>
                  <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-white">
                    2
                  </span>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <Avatar
                      src="https://randomuser.me/api/portraits/men/5.jpg"
                      name="Alan Joseph"
                      className="h-10 w-10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-semibold text-gray-900">Alan Joseph</h5>
                        <span className="text-xs text-gray-500">01:35 AM</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Hi I am Alan,</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="rounded-lg bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Contact Info</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <PiPhone className="h-5 w-5 text-gray-500" />
                    <span>+12 3456789587</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <PiGlobe className="h-5 w-5 text-gray-500" />
                    <span>https://pixelstrap.com</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-700">
                    <PiMapPin className="h-5 w-5 text-gray-500" />
                    <span>1766 Fidler Drive Texas, 78238</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2 rounded-lg bg-white p-4">
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <PiShareNetwork className="h-5 w-5" />
                  <span>Share Contact</span>
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PiTrash className="h-5 w-5" />
                  <span>Clear Chat</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <PiExport className="h-5 w-5" />
                  <span>Export Chat</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-red-600 transition-colors hover:bg-red-50">
                  <PiWarning className="h-5 w-5" />
                  <span>Report Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Lightbox for Media Preview */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        plugins={[Video, Zoom]}
        zoom={{ maxZoomPixelRatio: 5 }}
      />
    </>
  );
}
