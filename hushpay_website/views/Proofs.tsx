import React, { useState, useEffect } from 'react';
import { PixelButton, PixelCard } from '../components/RetroUI';
import { MOCK_TEMPLATES } from '../services/mockData';
import { Shield, CheckCircle, RefreshCcw, Terminal, FileCode, Copy, Share2 } from 'lucide-react';

// Terminal log effect component
const TerminalLoader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        const steps = [
            "Initializing ZK-SNARK circuit...",
            "Loading proving key (45MB)...",
            "Reading private wallet state...",
            "Witness generation started...",
            "Witness verified.",
            "Constructing proof...",
            "Compressing proof...",
            "PROOF GENERATED SUCCESSFULLY."
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                setLogs(prev => [...prev, `> ${steps[currentStep]}`]);
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 500);
            }
        }, 300);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="bg-black p-4 font-mono text-xs md:text-sm text-green-500 h-full flex flex-col justify-end">
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
};

export const Proofs: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedProof, setGeneratedProof] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setGeneratedProof(null);
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 font-pixel-body h-full">
      <div className="col-span-1">
        <PixelCard title="Available Proof Templates" className="h-full">
            <div className="mt-4 space-y-4 h-full overflow-y-auto pr-2">
                {MOCK_TEMPLATES.map(template => (
                    <div 
                        key={template.id} 
                        className={`border-2 p-4 transition-all cursor-pointer group relative ${generating === template.id ? 'border-green-500 bg-green-900/10' : 'border-gray-700 hover:border-white hover:bg-gray-900'}`} 
                        onClick={() => !generating && handleGenerate(template.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl mb-1 text-white group-hover:text-green-400 transition-colors">{template.title}</h3>
                                <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                                <div className="flex gap-2">
                                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 uppercase border border-gray-600">{template.requirement}</span>
                                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 uppercase border border-gray-600">Zero-Knowledge</span>
                                </div>
                            </div>
                            <Shield className={`text-gray-500 group-hover:text-white transition-colors ${generating === template.id ? 'text-green-500 animate-pulse' : ''}`} />
                        </div>
                        
                        {generating === template.id && (
                            <div className="absolute inset-0 bg-black/50 cursor-not-allowed"></div>
                        )}
                    </div>
                ))}
            </div>
        </PixelCard>
      </div>

      <div className="col-span-1">
        <PixelCard title="Proof Execution Environment" className="h-full min-h-[400px] flex flex-col">
            <div className="mt-4 flex-1 flex items-center justify-center border-2 border-gray-800 p-1 bg-gray-950 relative overflow-hidden">
                {/* Background texture */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {generating ? (
                    <div className="w-full h-full text-left">
                        <TerminalLoader onComplete={() => {
                            setGeneratedProof(generating);
                            setGenerating(null);
                        }} />
                    </div>
                ) : generatedProof ? (
                    <div className="text-center w-full p-4 animate-in zoom-in duration-300">
                        <div className="inline-block p-4 border-2 border-green-500 rounded-full mb-6 bg-green-900/20 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <CheckCircle size={64} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl mb-2 text-white font-pixel-header tracking-wider">PROOF VALID</h3>
                        <p className="text-green-500/80 mb-6 text-sm uppercase">Cryptographically Verified</p>
                        
                        <div className="bg-black p-4 text-xs font-mono text-left break-all border border-green-900 mb-6 h-40 overflow-y-auto custom-scrollbar relative group">
                            <div className="absolute top-2 right-2 opacity-50"><FileCode size={14}/></div>
                            <span className="text-purple-400">const</span> <span className="text-blue-400">proof</span> = {'{'}
                            <br/>
                            &nbsp;&nbsp;<span className="text-yellow-400">"id"</span>: <span className="text-green-300">"aleo1x9...83d"</span>,
                            <br/>
                            &nbsp;&nbsp;<span className="text-yellow-400">"inputs"</span>: [
                            <br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">"5000000000"</span>, <span className="text-gray-500">// Private Input Hash</span>
                            <br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">"{Date.now()}"</span> <span className="text-gray-500">// Timestamp</span>
                            <br/>
                            &nbsp;&nbsp;],
                            <br/>
                            &nbsp;&nbsp;<span className="text-yellow-400">"signature"</span>: <span className="text-green-300">"0x7f8a91...b2c3"</span>
                            <br/>
                            {'}'}
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                            <PixelButton className="flex items-center gap-2 text-sm">
                                <Copy size={14} /> COPY DATA
                            </PixelButton>
                            <PixelButton variant="secondary" className="flex items-center gap-2 text-sm">
                                <Share2 size={14} /> SEND
                            </PixelButton>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-600 max-w-xs">
                        <div className="mb-6 mx-auto w-20 h-20 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center">
                            <Terminal size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg text-gray-400 mb-2">Ready to Prove</p>
                        <p className="text-sm">Select a template from the left to generate a Zero-Knowledge proof of your financial standing.</p>
                        <p className="text-xs mt-4 text-green-900/60 uppercase">No raw data ever leaves this device</p>
                    </div>
                )}
            </div>
        </PixelCard>
      </div>
    </div>
  );
};