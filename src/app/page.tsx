"use client";

import { useChat } from "@ai-sdk/react";
import { Send, ShoppingBag, Loader2, Search, ArrowLeft, Sparkles, ShoppingCart, Bookmark, Plus, DollarSign, ListFilter, Tag, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const isLoading = status === "streaming" || status === "submitted";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="chat-layout">
      {/* Header matching Wizard Beta style */}
      <header className="app-header">
        <div className="header-left">
          <button className="back-button" aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div className="brand">
            Buybird<sup className="beta-tag">BETA</sup>
          </div>
          <div className="header-subtitle">Shopping Agent</div>
        </div>
        <button className="cart-button" aria-label="Cart">
          <ShoppingCart size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <section className="messages-area">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>Hi there!</h2>
            <p className="headline">I'm your superpowered shopping agent</p>
          </div>
        ) : (
          messages.map((msg) => {
            const m = msg as any;
            return (
              <div key={m.id} className={`message-row ${m.role}`}>
                <div className="message-content">
                  <div className="message-bubble">
                    
                    {m.parts && m.parts.map((part: any, index: number) => {
                      if (part.type === "text") {
                        return (
                          <div key={index} className="markdown-content">
                            <ReactMarkdown>{part.text}</ReactMarkdown>
                          </div>
                        );
                      }
                      
                      // SDK v6: tool parts are typed as "tool-<toolName>"
                      if (part.type === "tool-search_products" || part.type === "tool-invocation") {
                        const toolCallId = part.toolCallId;
                        const args = part.input || part.args || (part.toolInvocation && part.toolInvocation.args);
                        const state = part.state || (part.toolInvocation && part.toolInvocation.state);
                        const result = part.output || part.result || (part.toolInvocation && part.toolInvocation.result);

                        if (state === "call" || state === "partial-call" || state === "input-available") {
                          return (
                            <div key={toolCallId || index} className="tool-call">
                              <Search size={16} className="spin-slow" />
                              <span>Searching for &quot;{args?.query || "products"}&quot;...</span>
                            </div>
                          );
                        }
                        
                        if (state === "result" || state === "output-available") {
                          if (!result || !result.success) {
                            return (
                              <div key={toolCallId || index} className="tool-result error">
                                <p>{result?.message || "Failed to search"}</p>
                              </div>
                            );
                          }
                          
                          const products = result.products || [];
                          
                          return (
                            <div key={toolCallId || index} className="tool-result success">
                              <div className="slider-container">
                                <div className="slider-track">
                                  {/* First 2 products as Hero Cards */}
                                  {products.slice(0, 2).map((p: any, idx: number) => (
                                    <div key={p.id || idx} className="hero-card">
                                      <div className="hero-header">
                                        <span className="hero-tag">Best Pick</span>
                                        <Bookmark size={18} className="bookmark-icon" />
                                      </div>
                                      <div className="hero-image-wrapper">
                                        {p.thumbnail ? (
                                          <img src={p.thumbnail} alt={p.title} className="hero-image" />
                                        ) : (
                                          <ShoppingBag size={48} className="product-image-placeholder" />
                                        )}
                                      </div>
                                      <div className="hero-info">
                                        <div className="hero-brand">{p.source}</div>
                                        <h4 className="hero-title">{p.title?.length > 55 ? p.title.substring(0, 55) + "..." : p.title}</h4>
                                        <div className="hero-price">{p.price} <span>at {p.source}</span></div>
                                        
                                        <div className="quote-box">
                                          <div className="quote-header">
                                            <Sparkles size={12} /> Buybird says...
                                          </div>
                                          <p>&quot;{p.description ? (p.description.length > 70 ? p.description.substring(0, 70) + "..." : p.description) : "A great choice based on your search."}&quot;</p>
                                        </div>
                                        
                                        <div className="hero-actions">
                                          <a href={p.link} target="_blank" rel="noreferrer" className="btn-visit">Visit Store <ChevronRight size={14} /></a>
                                          <a href="#" className="btn-more">More like this</a>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Still Looking Revisions Grid */}
                                  {products.length > 2 && (
                                    <div className="revisions-block">
                                      <div className="revisions-header">
                                        <h4>Still looking?</h4>
                                        <p>Try these revisions...</p>
                                      </div>
                                      <div className="revisions-grid">
                                        <div className="revision-card" onClick={() => sendMessage({ text: "Show me more results" })}>
                                          <div className="icon-wrap blue-light"><Plus size={16} /></div>
                                          <div className="rev-info">
                                            <h5>More Results</h5>
                                            <p>More options that might be a match</p>
                                          </div>
                                        </div>
                                        <div className="revision-card" onClick={() => sendMessage({ text: "Filter by price" })}>
                                          <div className="icon-wrap blue-dark"><DollarSign size={16} /></div>
                                          <div className="rev-info">
                                            <h5>Filter Price</h5>
                                            <p>Filter by budget limits</p>
                                          </div>
                                        </div>
                                        <div className="revision-card" onClick={() => sendMessage({ text: "Filter by category" })}>
                                          <div className="icon-wrap blue-dark"><ListFilter size={16} /></div>
                                          <div className="rev-info">
                                            <h5>Filter Category</h5>
                                            <p>Search similar categories</p>
                                          </div>
                                        </div>
                                        <div className="revision-card" onClick={() => sendMessage({ text: "Filter by brand" })}>
                                          <div className="icon-wrap blue-dark"><Tag size={16} /></div>
                                          <div className="rev-info">
                                            <h5>Filter Brand</h5>
                                            <p>Filter by top brands</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Remaining Products as alternative Hero Cards */}
                                  {products.slice(2).map((p: any, idx: number) => (
                                    <div key={p.id || idx} className="hero-card">
                                      <div className="hero-header">
                                        <span className="hero-tag alternative">Alternative</span>
                                        <Bookmark size={18} className="bookmark-icon" />
                                      </div>
                                      <div className="hero-image-wrapper">
                                        {p.thumbnail ? (
                                          <img src={p.thumbnail} alt={p.title} className="hero-image" />
                                        ) : (
                                          <ShoppingBag size={48} className="product-image-placeholder" />
                                        )}
                                      </div>
                                      <div className="hero-info">
                                        <div className="hero-brand">{p.source}</div>
                                        <h4 className="hero-title">{p.title?.length > 55 ? p.title.substring(0, 55) + "..." : p.title}</h4>
                                        <div className="hero-price">{p.price} <span>at {p.source}</span></div>
                                        
                                        <div className="quote-box">
                                          <div className="quote-header">
                                            <Sparkles size={12} /> Buybird says...
                                          </div>
                                          <p>&quot;{p.description ? (p.description.length > 70 ? p.description.substring(0, 70) + "..." : p.description) : "A solid alternative based on your search."}&quot;</p>
                                        </div>
                                        
                                        <div className="hero-actions">
                                          <a href={p.link} target="_blank" rel="noreferrer" className="btn-visit">Visit Store <ChevronRight size={14} /></a>
                                          <a href="#" className="btn-more">More like this</a>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isLoading && messages.length > 0 && (messages[messages.length - 1] as any).role === "user" && (
          <div className="message-row assistant">
            <div className="message-content">
              <div className="message-bubble typing">
                <Loader2 size={20} className="spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="message-row assistant">
            <div className="message-content">
              <div className="message-bubble error">
                <p>Error: {error.message || String(error)}</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Floating Pill Input matching screenshot */}
      <form onSubmit={handleSubmit} className="input-area">
        <Sparkles size={18} className="input-icon" />
        <input
          className="chat-input"
          value={input}
          placeholder={messages.length === 0 ? "Write what you want to shop..." : "Ask a follow up..."}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </main>
  );
}
