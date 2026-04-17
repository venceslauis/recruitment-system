import React, { useState, useEffect } from "react";
import API from "../services/api";

const IssuerHome: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [recipient, setRecipient] = useState("");
    const [issuing, setIssuing] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const fetchHistory = async () => {
        try {
            const { data } = await API.get("/issuer/history");
            setHistory(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Auto-parse certificate when file is selected
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        if (!selected) return;

        setParsing(true);
        setTitle("");
        setRecipient("");
        try {
            const fd = new FormData();
            fd.append("certificate", selected);
            const { data } = await API.post("/candidate/parse-certificate", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (data.title)     setTitle(data.title);
            if (data.name)      setRecipient(data.name);
        } catch (err) {
            console.error("Auto-parse failed:", err);
            // Fields stay blank — issuer can fill manually
        } finally {
            setParsing(false);
        }
    };

    const handleIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIssuing(true);
        setStatus("Generating Digital Fingerprint...");
        setError("");

        const formData = new FormData();
        formData.append("certificate", file);
        formData.append("title", title);
        formData.append("recipient", recipient);

        try {
            console.log("Issuing certificate...");
            await API.post("/issuer/issue", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setStatus(`Success! Confirmed in Block.`);
            setFile(null); setTitle(""); setRecipient("");
            fetchHistory();
            setTimeout(() => setStatus(""), 5000);
        } catch (err: any) {
            console.error("Issuance Error:", err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Connection failed";
            setError(errorMsg);
            setStatus("");
        } finally {
            setIssuing(false);
        }
    };

    return (
        <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto text-white">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-glow mb-2 italic">Issuer Authority</h1>
                    <p className="text-gray-300 uppercase tracking-widest text-xs">Official Blockchain Registry Management</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-300 tracking-tighter">CONNECTED TO SEPOLIA TESTNET</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Issuance Form ── */}
                <div className="lg:col-span-1">
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-6">Issue New Proof</h2>
                        <form onSubmit={handleIssue} className="space-y-5">

                            {/* ── File Upload (triggers auto-parse) ── */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase">Document File</label>
                                <input
                                    type="file"
                                    required
                                    onChange={handleFileSelect}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30"
                                />
                                {parsing && (
                                    <p className="text-xs text-yellow-300 animate-pulse mt-2 flex items-center gap-2">
                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Parsing certificate with OCR...
                                    </p>
                                )}
                            </div>

                            {/* ── Certificate Title (auto-filled) ── */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase flex items-center gap-2">
                                    Certificate Title
                                    {parsing && <span className="text-yellow-400 text-[10px] font-normal animate-pulse">auto-filling...</span>}
                                    {!parsing && title && <span className="text-emerald-400 text-[10px] font-normal">✓ auto-detected</span>}
                                </label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-white/5 rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-emerald-400 transition outline-none"
                                    placeholder="e.g. AWS Solutions Architect"
                                />
                            </div>

                            {/* ── Recipient Name (auto-filled) ── */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase flex items-center gap-2">
                                    Recipient Name
                                    {parsing && <span className="text-yellow-400 text-[10px] font-normal animate-pulse">auto-filling...</span>}
                                    {!parsing && recipient && <span className="text-emerald-400 text-[10px] font-normal">✓ auto-detected</span>}
                                </label>
                                <input
                                    required
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                    className="w-full bg-white/5 rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-emerald-400 transition outline-none"
                                    placeholder="Full name for verification"
                                />
                            </div>

                            {status && <div className="text-sm text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 animate-pulse">{status}</div>}
                            {error && <div className="text-sm text-red-300 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                            <button
                                type="submit"
                                disabled={issuing || parsing}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-lg uppercase tracking-widest"
                            >
                                {issuing ? "MINTING..." : parsing ? "PARSING..." : "Register on-chain"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── History List ── */}
                <div className="lg:col-span-2">
                    <div className="glass p-8 rounded-3xl min-h-[500px]">
                        <h2 className="text-2xl font-bold mb-6">Issuance History</h2>
                        <div className="space-y-4">
                            {history.length > 0 ? history.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl group-hover:bg-emerald-500/20 transition">
                                            <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{item.title}</h4>
                                            <p className="text-xs text-gray-400">Recipient: <span className="text-white">{item.recipient}</span></p>
                                            <p className="text-[10px] font-mono text-gray-500 mt-2 truncate max-w-[200px]">Hash: {item.fileHash}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                            IMMUTABLE PROOF
                                        </div>
                                        <span className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-gray-500 italic opacity-50">
                                    No certificates issued yet. Start by uploading a document.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssuerHome;
