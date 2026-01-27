import React, { useState, useRef, useEffect } from 'react';
import { PixelButton, PixelCard, PixelInput } from '../components/RetroUI';
import { Contact, Message } from '../types';
import { MOCK_CONTACTS, MOCK_MESSAGES } from '../services/mockData';
import { Send, ShieldCheck, User, Lock, Wifi } from 'lucide-react';

export const Chat: React.FC = () => {
  const [activeContact, setActiveContact] = useState<Contact>(MOCK_CONTACTS[0]);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'Me',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'text'
    };
    setMessages([...messages, newMsg]);
    setInputText('');

    // Simulate reply
    setTimeout(() => {
        const replyMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: activeContact.name,
            content: "Received. Verifying on-chain...",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
            type: 'text'
        };
        setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const sendProof = () => {
    const proofMsg: Message = {
      id: Date.now().toString(),
      sender: 'Me',
      content: 'PROOF OF SOLVENCY',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'proof',
      proofData: {
        type: 'Solvency',
        value: '> $5,000',
        verified: true
      }
    };
    setMessages([...messages, proofMsg]);
    
    setTimeout(() => {
        const replyMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: activeContact.name,
            content: "Proof Verified! ✅ Credit confirmed without viewing balance.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
            type: 'text'
        };
        setMessages(prev => [...prev, replyMsg]);
    }, 2500);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 p-4 font-pixel-body">
      {/* Contact List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <PixelCard title="Encrypted Channels" className="h-full">
          <div className="flex flex-col gap-2 mt-4">
            {MOCK_CONTACTS.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => setActiveContact(contact)}
                className={`p-3 border-2 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${activeContact.id === contact.id ? 'bg-white text-black border-white' : 'border-gray-800 hover:border-gray-500'}`}
              >
                <div className="flex items-center gap-3 z-10">
                    <div className={`p-1 border ${activeContact.id === contact.id ? 'border-black' : 'border-white'} rounded-none`}>
                         <User size={16} />
                    </div>
                    <span className="uppercase tracking-wide">{contact.name}</span>
                </div>
                {contact.status === 'online' && (
                    <div className="flex items-center gap-1 text-[10px] uppercase z-10">
                        <Wifi size={10} />
                        CONN
                    </div>
                )}
              </div>
            ))}
          </div>
        </PixelCard>
      </div>

      {/* Chat Area */}
      <div className="w-full md:w-2/3 flex flex-col h-[600px] md:h-auto">
        <PixelCard className="flex-1 flex flex-col relative overflow-hidden border-green-500/30">
          
          {/* Header */}
          <div className="absolute top-0 left-0 w-full bg-gray-900 border-b border-gray-700 p-2 flex justify-between items-center z-20">
             <div className="flex items-center gap-2 text-green-500">
                <Lock size={14} />
                <span className="text-xs uppercase tracking-widest">E2E ENCRYPTED // ZK ENABLED</span>
             </div>
             <div className="text-gray-500 text-xs">
                PEER: <span className="text-white">{activeContact.name}</span>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 mb-4 mt-10 pr-2">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] relative group ${msg.isMe ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                   <div className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider flex gap-2">
                      <span>{msg.sender}</span>
                      <span>{msg.timestamp}</span>
                   </div>

                   <div className={`p-4 border-2 relative ${
                     msg.type === 'proof' 
                       ? 'border-green-500 bg-green-900/10 text-green-400' 
                       : msg.isMe ? 'border-white bg-gray-900 text-white' : 'border-gray-600 bg-black text-gray-200'
                   }`}>
                      {msg.type === 'proof' && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-2 text-green-500 border border-green-500 text-[10px] uppercase flex items-center gap-1">
                             <ShieldCheck size={10} /> ZK PROOF ATTACHED
                          </div>
                      )}

                      {msg.type === 'text' ? (
                        <p className="text-lg leading-snug font-vt323">{msg.content}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-1 min-w-[200px]">
                          <div className="text-4xl">🧾</div>
                          <div className="text-center">
                              <div className="text-sm text-gray-400 uppercase">Proving</div>
                              <div className="font-bold text-xl text-white">{msg.proofData?.value}</div>
                          </div>
                          <div className="w-full h-px bg-green-500/50 my-1"></div>
                          <div className="text-[10px] uppercase bg-green-500 text-black px-2 py-0.5">
                            Verifiable on Aleo
                          </div>
                        </div>
                      )}
                      
                      {/* Message tail decorative */}
                      <div className={`absolute bottom-[-2px] w-2 h-2 bg-black border-r-2 border-b-2 ${msg.isMe ? 'right-[-6px] border-white rotate-[-45deg]' : 'left-[-6px] border-gray-600 rotate-[-135deg]'}`}></div>
                   </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-white pt-4 flex gap-3 bg-black z-20">
            <PixelButton onClick={sendProof} variant="secondary" className="px-4 hover:border-green-500 hover:text-green-500 group" title="Attach ZK Proof">
              <ShieldCheck size={20} className="group-hover:animate-pulse" />
            </PixelButton>
            <div className="flex-1 relative">
              <PixelInput 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="border-none bg-gray-900 focus:bg-gray-800 h-full pl-4"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
                 SECURE INPUT
              </div>
            </div>
            <PixelButton onClick={handleSend} className="px-6">
              <Send size={20} />
            </PixelButton>
          </div>
        </PixelCard>
      </div>
    </div>
  );
};