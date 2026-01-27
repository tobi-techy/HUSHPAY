import React, { useState, useEffect } from 'react';
import { BackgroundParticles } from './components/BackgroundParticles';
import { Cityscape } from './components/Cityscape';
import { PixelButton, PixelCard, PixelInput } from './components/RetroUI';
import { 
  MessageSquare, 
  Shield, 
  Globe, 
  Zap, 
  Smartphone, 
  EyeOff, 
  Layers, 
  ArrowRight, 
  Check, 
  Bell, 
  Users, 
  Lock,
  Terminal,
  Wifi,
  Battery
} from 'lucide-react';

const PixelPhoneDemo = () => {
  const [messages, setMessages] = useState([
    { text: "send 50 usd1 to +234...", sender: "user", delay: 1000 },
  ]);

  useEffect(() => {
    const sequence = [
      { text: "Verifying encrypted balance...", sender: "system", delay: 2000 },
      { text: "✓ Sent! Amount hidden on-chain.", sender: "bot", delay: 3500 },
      { text: "split 100 sol with +234...", sender: "user", delay: 5500 },
      { text: "Created split request.", sender: "bot", delay: 7000 }
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let accumulatedDelay = 0;

    sequence.forEach(msg => {
      accumulatedDelay += msg.delay - (sequence[sequence.indexOf(msg) - 1]?.delay || 1000);
      const timeout = setTimeout(() => {
        setMessages(prev => [...prev, msg]);
      }, accumulatedDelay + 1000);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-[300px] h-[550px] bg-black border-4 border-gray-700 mx-auto shadow-[10px_10px_0px_0px_rgba(34,197,94,0.2)]">
      {/* Phone Header */}
      <div className="bg-gray-800 p-2 flex justify-between items-center border-b-2 border-gray-600">
         <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-sm"></div>
            <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
         </div>
         <div className="text-[10px] text-green-500 flex gap-2 font-mono">
            <Wifi size={12} />
            <Battery size={12} />
            <span>100%</span>
         </div>
      </div>

      {/* Chat Header */}
      <div className="bg-[#004d40] p-3 flex items-center gap-3 border-b-4 border-black">
        <div className="w-8 h-8 bg-green-600 border-2 border-white flex items-center justify-center text-white font-bold">HP</div>
        <div>
          <div className="text-white text-lg leading-none">HushPay_Bot</div>
          <div className="text-green-300 text-xs uppercase tracking-wider">Online // Secure</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="p-4 space-y-4 h-[380px] bg-black overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
          >
            <div className={`max-w-[85%] p-2 text-sm border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              msg.sender === 'user' 
                ? 'bg-green-900 border-green-500 text-green-100' 
                : 'bg-gray-900 border-gray-500 text-gray-300'
            }`}>
              {msg.sender === 'system' && <span className="text-yellow-500 mr-2 blink">_</span>}
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Placeholder */}
      <div className="absolute bottom-0 w-full bg-gray-900 p-3 border-t-2 border-gray-600">
        <div className="flex gap-2">
            <div className="flex-1 h-8 border-b-2 border-green-500 bg-black text-green-500 px-2 flex items-center">
                <span className="animate-pulse">|</span>
            </div>
            <div className="w-8 h-8 border-2 border-green-500 bg-green-900 flex items-center justify-center">
                <ArrowRight size={16} className="text-green-400" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden scanlines selection:bg-green-500 selection:text-black">
      <BackgroundParticles />
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto bg-black/80 border-b-2 border-green-900 pb-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🤫</span> 
            <span className="text-3xl font-bold tracking-widest text-white shadow-[2px_2px_0px_#22c55e]">HUSHPAY</span>
          </div>
          <div className="hidden md:flex gap-6 text-xl text-gray-400">
            <a href="#features" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[FEATURES]</a>
            <a href="#privacy" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[PRIVACY]</a>
            <a href="#compliance" className="hover:text-green-400 hover:underline decoration-2 underline-offset-4 decoration-green-500 transition-all">[COMPLIANCE]</a>
          </div>
          <PixelButton className="text-lg py-1 px-4">
            EARLY_ACCESS
          </PixelButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col md:flex-row items-center gap-12 z-10">
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="inline-block border-2 border-green-500 bg-green-900/20 px-4 py-2 text-green-400 text-lg mb-4">
            <span className="mr-2 animate-pulse">●</span>
            WHATSAPP & SMS INTEGRATION LIVE
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold leading-none tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(34,197,94,0.5)]">
            QUIET<br/>
            <span className="text-green-500">MONEY MOVES</span>
          </h1>
          
          <p className="text-2xl text-gray-400 max-w-lg mx-auto md:mx-0 font-pixel-body leading-relaxed border-l-4 border-gray-700 pl-4">
            Private crypto payments via WhatsApp. No wallet addresses. No public amounts. Just send money like texting.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start pt-8">
            <PixelButton className="text-2xl py-4 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]">
               START CHATTING_
            </PixelButton>
            <PixelButton variant="secondary" className="text-2xl py-4">
               DOCS.md
            </PixelButton>
          </div>
          
          <div className="pt-8 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-mono">
             <span>TRUSTED BY 10,000+ EARLY USERS</span>
             <div className="h-px bg-gray-700 flex-1 max-w-[100px]"></div>
          </div>
        </div>

        <div className="flex-1 relative animate-in fade-in slide-in-from-right-8 duration-700">
           {/* Decorative elements behind phone */}
           <div className="absolute top-10 -right-10 w-full h-full border-4 border-dashed border-gray-800 z-[-1]"></div>
           <div className="absolute -top-10 -left-10 w-24 h-24 border-t-4 border-l-4 border-green-500 z-[-1]"></div>
           <div className="absolute -bottom-10 -right-10 w-24 h-24 border-b-4 border-r-4 border-green-500 z-[-1]"></div>
           
           <PixelPhoneDemo />
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 relative border-t-4 border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold uppercase text-white"><span className="text-green-500">More Than</span> Just Payments</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-mono">HushPay brings DeFi power to your chat window.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PixelCard title="Phone-to-Phone" className="h-full">
               <div className="text-green-500 mb-4"><Smartphone size={40} /></div>
               <p className="text-gray-300 text-xl leading-relaxed">Send crypto using phone numbers. No copying long hex addresses. It just works.</p>
            </PixelCard>
            
            <PixelCard title="Social Split" className="h-full">
               <div className="text-green-500 mb-4 flex justify-between items-start">
                   <Users size={40} />
                   <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 border border-blue-500">NEW_FEATURE</span>
               </div>
               <p className="text-gray-300 text-xl leading-relaxed">Split bills instantly in group chats. 'split 100 sol with @mark @sarah'.</p>
            </PixelCard>

            <PixelCard title="Recurring" className="h-full">
               <div className="text-green-500 mb-4"><Zap size={40} /></div>
               <p className="text-gray-300 text-xl leading-relaxed">Automated weekly or monthly transfers. Perfect for rent or subscriptions.</p>
            </PixelCard>

            <PixelCard title="Multi-Language" className="h-full">
               <div className="text-green-500 mb-4"><Globe size={40} /></div>
               <p className="text-gray-300 text-xl leading-relaxed">Auto-detects English, Spanish, French, and Portuguese based on country code.</p>
            </PixelCard>

            <PixelCard title="Price Alerts" className="h-full">
               <div className="text-green-500 mb-4"><Bell size={40} /></div>
               <p className="text-gray-300 text-xl leading-relaxed">Get WhatsApp notifications when your tokens hit target prices.</p>
            </PixelCard>

            <PixelCard title="Compliance" className="h-full">
               <div className="text-green-500 mb-4"><Shield size={40} /></div>
               <p className="text-gray-300 text-xl leading-relaxed">Built-in sanctions screening via Range API. Safe for mainstream.</p>
            </PixelCard>
          </div>
        </div>
      </section>

      {/* Triple Privacy Layer */}
      <section id="privacy" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 border-b-4 border-gray-800 pb-8">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">TRIPLE PRIVACY <span className="text-purple-400 underline decoration-4 underline-offset-8">ARCHITECTURE</span></h2>
            <p className="text-2xl text-gray-400 font-mono">&gt; Protocols initialized: 3</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Layer 1 */}
            <PixelCard className="border-purple-500" title="LAYER_01">
              <div className="border-2 border-purple-500 p-4 mb-6 bg-purple-900/20">
                 <EyeOff size={40} className="text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-purple-400">AMOUNT HIDDEN</h3>
              <p className="text-sm font-mono text-gray-500 mb-4 bg-gray-900 p-1 inline-block">Powered by ShadowWire</p>
              <ul className="space-y-4 text-gray-300 text-lg">
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Invisible on Solscan</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Bulletproofs ZK</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Radr Labs Integ.</li>
              </ul>
            </PixelCard>

            {/* Layer 2 */}
            <PixelCard className="border-blue-500" title="LAYER_02">
              <div className="border-2 border-blue-500 p-4 mb-6 bg-blue-900/20">
                 <Layers size={40} className="text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-blue-400">SENDER HIDDEN</h3>
              <p className="text-sm font-mono text-gray-500 mb-4 bg-gray-900 p-1 inline-block">Via Privacy Cash</p>
              <ul className="space-y-4 text-gray-300 text-lg">
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Anon Transfer Pools</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Deposit &gt; Mix &gt; Withdraw</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Untraceable Source</li>
              </ul>
            </PixelCard>

            {/* Layer 3 */}
            <PixelCard className="border-green-500" title="LAYER_03">
               <div className="border-2 border-green-500 p-4 mb-6 bg-green-900/20">
                 <Globe size={40} className="text-green-400" />
              </div>
              <h3 className="text-3xl font-bold mb-2 text-green-400">CROSS-CHAIN</h3>
              <p className="text-sm font-mono text-gray-500 mb-4 bg-gray-900 p-1 inline-block">Using SilentSwap</p>
              <ul className="space-y-4 text-gray-300 text-lg">
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Private Bridge</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> No Public Records</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-green-500"/> Asset Conversion</li>
              </ul>
            </PixelCard>
          </div>
        </div>
      </section>

      {/* Receipts Section */}
      <section className="py-24 px-6 bg-black border-t-4 border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1 space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold uppercase">Verifiable <span className="text-green-500">Receipts</span></h2>
              <p className="text-gray-400 text-2xl leading-relaxed">Just because it's private doesn't mean it's not provable. Every transaction generates a digital receipt hosted on Cloudinary.</p>
              
              <div className="border-2 border-gray-700 bg-gray-900 p-4 font-mono text-sm text-green-400">
                 &gt; Generating proof hash...<br/>
                 &gt; 0x7f83b...2a1 verified.<br/>
                 &gt; Badge "PRIVATE" assigned.
              </div>

              <div className="flex gap-4 flex-wrap pt-4">
                 <div className="px-4 py-2 bg-gray-900 border-2 border-green-500 text-green-500 text-sm flex items-center gap-2 uppercase font-bold tracking-wider">
                    <Lock size={16}/> PRIVATE_BADGE
                 </div>
                 <div className="px-4 py-2 bg-gray-900 border-2 border-blue-500 text-blue-500 text-sm flex items-center gap-2 uppercase font-bold tracking-wider">
                    <Globe size={16}/> CROSS-CHAIN
                 </div>
              </div>
           </div>

           {/* Pixel Receipt */}
           <div className="flex-1 w-full max-w-md">
              <div className="bg-gray-200 text-black p-6 relative shadow-[10px_10px_0px_#22c55e] border-4 border-white transform -rotate-1 hover:rotate-0 transition-transform">
                  {/* Jagged top/bottom edges simulated with css gradients or clip path could go here, keeping simple for now */}
                  <div className="text-center border-b-4 border-dashed border-black pb-6 mb-6">
                     <div className="w-16 h-16 bg-black text-white text-4xl flex items-center justify-center mx-auto mb-4 border-4 border-black">🤫</div>
                     <h3 className="font-bold text-3xl mb-1 uppercase tracking-tighter">HushPay</h3>
                     <p className="text-gray-600 text-lg uppercase font-mono">Secure Transfer Receipt</p>
                  </div>
                  
                  <div className="space-y-4 mb-6 font-mono text-lg">
                     <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span className="text-gray-600 uppercase">Amount</span>
                        <span className="font-bold">*** HIDDEN ***</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span className="text-gray-600 uppercase">To</span>
                        <span className="font-bold">+1 (555) ***-99</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span className="text-gray-600 uppercase">Date</span>
                        <span className="font-bold">2024-10-24</span>
                     </div>
                     <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span className="text-gray-600 uppercase">Protocol</span>
                        <span className="font-bold text-purple-700">SHADOW_WIRE</span>
                     </div>
                  </div>

                  <div className="bg-white border-2 border-black p-4 text-center">
                     <div className="w-24 h-24 bg-black mx-auto mb-2 opacity-80" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fff 5px, #fff 10px)'}}></div>
                     <div className="text-xs font-bold uppercase">Scan to Verify</div> 
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-4 border-gray-800 bg-black relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-left">
              <div className="font-bold text-3xl mb-2 text-white">HUSHPAY</div>
              <p className="text-gray-500 uppercase">Quiet money moves.</p>
           </div>
           <div className="flex gap-8 text-xl text-gray-400 uppercase">
              <a href="#" className="hover:text-green-500 hover:underline">[Terms]</a>
              <a href="#" className="hover:text-green-500 hover:underline">[Privacy]</a>
              <a href="#" className="hover:text-green-500 hover:underline">[Twitter]</a>
              <a href="#" className="hover:text-green-500 hover:underline">[GitHub]</a>
           </div>
           <div className="text-sm text-gray-600 font-mono">
              © 2024 HUSHPAY PROTOCOL.
           </div>
        </div>
      </footer>
      
      <Cityscape />
    </div>
  );
}