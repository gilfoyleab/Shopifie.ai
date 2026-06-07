"use client";

import { useChat } from "@ai-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { Send, ShoppingBag, Loader2, Search, ArrowLeft, Sparkles, ShoppingCart, Bookmark, Plus, DollarSign, ListFilter, Tag, ChevronRight, X, WalletCards } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CheckoutProductInput, CheckoutSession } from "@/lib/checkout/types";

function normalizeProductForCheckout(product: Record<string, unknown>): CheckoutProductInput {
  return {
    id: typeof product.id === "string" || typeof product.id === "number" ? product.id : null,
    title: typeof product.title === "string" ? product.title : "Untitled product",
    source: typeof product.source === "string" ? product.source : null,
    price:
      typeof product.price === "string" || typeof product.price === "number"
        ? product.price
        : null,
    extractedPrice:
      typeof product.extracted_price === "number"
        ? product.extracted_price
        : typeof product.extractedPrice === "number"
          ? product.extractedPrice
          : null,
    link: typeof product.link === "string" ? product.link : null,
    thumbnail: typeof product.thumbnail === "string" ? product.thumbnail : null,
    rating: typeof product.rating === "number" ? product.rating : null,
    reviews: typeof product.reviews === "number" ? product.reviews : null,
    delivery: typeof product.delivery === "string" ? product.delivery : null,
    description: typeof product.description === "string" ? product.description : null,
  };
}

function base64ToBytes(base64: string) {
  const binary = globalThis.atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return globalThis.btoa(binary);
}

function decodePreparedTransaction(checkout: CheckoutSession) {
  const payload = checkout.payment.response?.transactionBase64;

  if (!payload) {
    return null;
  }

  const bytes = base64ToBytes(payload);

  if (checkout.payment.response?.version === "v0") {
    return VersionedTransaction.deserialize(bytes);
  }

  return Transaction.from(bytes);
}

function getCheckoutBadgeLabel(status: CheckoutSession["status"]) {
  switch (status) {
    case "checkout_ready":
      return "Ready to prepare";
    case "payment_preparing":
      return "Preparing payment";
    case "payment_pending":
      return "Ready for wallet approval";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "expired":
      return "Expired";
    default:
      return "Checkout";
  }
}

function getTransactionExplorerUrl(signature: string) {
  return `https://solscan.io/tx/${signature}?cluster=devnet`;
}

function getAccountExplorerUrl(address: string) {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}

function getSettlementTokenLabel(symbol?: string) {
  if (symbol === "dUSDC") {
    return "Devnet Test USDC";
  }

  return symbol || "USDC";
}

function getSettlementTotalLabel(checkout: CheckoutSession | null) {
  if (!checkout) {
    return "Creating checkout...";
  }

  return `${checkout.pricing.settlementUiAmount.toFixed(2)} ${getSettlementTokenLabel(checkout.pricing.settlementSymbol)}`;
}

function getReceiverExplorerConfig(
  checkout: CheckoutSession | null,
  receipt: Record<string, unknown> | null,
) {
  const receiptTarget =
    typeof receipt?.receiverExplorerTarget === "string" ? receipt.receiverExplorerTarget : null;
  const receiptTokenAccount =
    typeof receipt?.receiverTokenAccount === "string" ? receipt.receiverTokenAccount : null;
  const receiptWallet = typeof receipt?.receiverWallet === "string" ? receipt.receiverWallet : null;

  const explorerTarget = receiptTarget || checkout?.payment.receiverExplorerTarget || "wallet";
  const receiverTokenAccount = receiptTokenAccount || checkout?.payment.receiverTokenAccount || null;
  const receiverWallet = receiptWallet || checkout?.merchant.wallet || "";

  if (explorerTarget === "token_account" && receiverTokenAccount) {
    return {
      href: getAccountExplorerUrl(receiverTokenAccount),
      label: "Open receiver token account on Solscan",
    };
  }

  return {
    href: getAccountExplorerUrl(receiverWallet),
    label: "Open receiver wallet on Solscan",
  };
}

export default function Home() {
  const { connected, connecting, publicKey, wallet, signTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const [checkoutPreviewProduct, setCheckoutPreviewProduct] = useState<CheckoutProductInput | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [checkoutReceipt, setCheckoutReceipt] = useState<Record<string, unknown> | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const isLoading = status === "streaming" || status === "submitted";
  const isCheckoutOpen = Boolean(checkoutPreviewProduct || checkoutSession);
  const activeProduct = checkoutSession?.product ?? checkoutPreviewProduct;
  const connectedWalletAddress = publicKey?.toBase58() ?? "";
  const walletLabel = wallet?.adapter.name || "Phantom";
  const receiverExplorer = getReceiverExplorerConfig(checkoutSession, checkoutReceipt);
  const settlementTokenLabel = getSettlementTokenLabel(checkoutSession?.pricing.settlementSymbol);
  const isPaymentComplete = checkoutSession?.status === "paid" && Boolean(checkoutReceipt);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const resetCheckoutState = () => {
    setCheckoutPreviewProduct(null);
    setCheckoutSession(null);
    setCheckoutError(null);
    setCheckoutNotice(null);
    setCheckoutReceipt(null);
    setIsCreatingCheckout(false);
    setIsPreparingPayment(false);
    setIsSubmittingPayment(false);
  };

  const handleBuyClick = async (product: Record<string, unknown>) => {
    const normalized = normalizeProductForCheckout(product);
    setCheckoutPreviewProduct(normalized);
    setCheckoutSession(null);
    setCheckoutError(null);
    setCheckoutNotice(null);
    setCheckoutReceipt(null);
    setIsCreatingCheckout(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: normalized }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to create checkout session.");
      }

      setCheckoutSession(data.checkout as CheckoutSession);
      setCheckoutNotice(
        "Your item is locked in checkout. Next, prepare the private payment request, then approve it in Phantom.",
      );
    } catch (checkoutCreationError) {
      setCheckoutError(
        checkoutCreationError instanceof Error
          ? checkoutCreationError.message
          : "Unable to create checkout session.",
      );
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handlePreparePayment = async () => {
    if (!checkoutSession) return;
    if (!connectedWalletAddress) {
      setCheckoutError("Connect your Phantom wallet first.");
      return;
    }

    setCheckoutError(null);
    setCheckoutNotice(null);
    setCheckoutReceipt(null);
    setIsPreparingPayment(true);

    try {
      const response = await fetch(`/api/checkout/${checkoutSession.id}/prepare-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: connectedWalletAddress }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to prepare private payment.");
      }

      setCheckoutSession(data.checkout as CheckoutSession);

      const prepMode = data?.prepared?.mode === "live" ? "live" : "simulated";
      setCheckoutNotice(
        prepMode === "live"
          ? "Private payment is prepared. The next step is to approve the transaction in Phantom."
          : "Private payment request is prepared in demo mode. You can still complete the flow and view the receipt.",
      );
    } catch (paymentPreparationError) {
      setCheckoutError(
        paymentPreparationError instanceof Error
          ? paymentPreparationError.message
          : "Unable to prepare private payment.",
      );
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handleSignAndSubmit = async () => {
    if (!checkoutSession) return;

    setCheckoutError(null);
    setCheckoutNotice(null);
    setIsSubmittingPayment(true);

    try {
      const isSimulatedPrep =
        checkoutSession.payment.mode === "simulated" ||
        !checkoutSession.payment.response?.transactionBase64;

      if (!isSimulatedPrep && !signTransaction) {
        throw new Error("This wallet does not support transaction signing.");
      }

      let signedTransactionBase64: string | undefined;

      if (!isSimulatedPrep) {
        const unsignedTransaction = decodePreparedTransaction(checkoutSession);

        if (!unsignedTransaction) {
          throw new Error("Prepared transaction payload is missing.");
        }

        const signedTransaction = await signTransaction!(unsignedTransaction);
        const serialized =
          signedTransaction instanceof Transaction
            ? signedTransaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
              })
            : signedTransaction.serialize();

        signedTransactionBase64 = bytesToBase64(serialized);
      }

      const response = await fetch(`/api/checkout/${checkoutSession.id}/submit-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTransactionBase64,
          simulate: isSimulatedPrep,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to submit payment.");
      }

      setCheckoutSession(data.checkout as CheckoutSession);
      setCheckoutReceipt((data.receipt as Record<string, unknown>) ?? null);
      setCheckoutNotice(null);
    } catch (submissionError) {
      setCheckoutError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign and submit payment.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
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
            <p className="headline">I&apos;m your superpowered shopping agent</p>
          </div>
        ) : (
          messages.map((msg) => {
            const m = msg as any;
            return (
              <div key={m.id} className={`message-row ${m.role}`}>
                <div className="message-content">
                  <div className="message-bubble">
                    
                    {m.parts && m.parts.filter((p: any) => p.type === "text").map((part: any, index: number) => (
                      <div key={`text-${index}`} className="markdown-content" style={{ marginBottom: m.parts.length > 1 ? '16px' : '0' }}>
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    ))}
                    
                    {m.parts && m.parts.filter((p: any) => p.type !== "text").map((part: any, index: number) => {
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
                                        <span className={`hero-tag ${idx === 0 ? '' : 'runner-up'}`}>{idx === 0 ? '🏆 Best Deal' : '🥈 Runner Up'}</span>
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
                                          <a href={p.link} target="_blank" rel="noreferrer" className="btn-visit-outline">Visit Store</a>
                                          <button onClick={() => handleBuyClick(p)} className="btn-buy-primary">
                                            Buy via Agent <ChevronRight size={14} />
                                          </button>
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
                                          <a href={p.link} target="_blank" rel="noreferrer" className="btn-visit-outline">Visit Store</a>
                                          <button onClick={() => handleBuyClick(p)} className="btn-buy-primary">
                                            Buy via Agent <ChevronRight size={14} />
                                          </button>
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

      {/* Checkout Sidebar Overlay */}
      {isCheckoutOpen && activeProduct && (
        <>
          <div className="checkout-backdrop" onClick={resetCheckoutState} />
          <aside className="checkout-sidebar">
            <div className="checkout-header">
              <h3>Secure Checkout</h3>
              <button className="close-btn" onClick={resetCheckoutState}>
                <X size={20} />
              </button>
            </div>
            
            <div className="checkout-product">
              {activeProduct.thumbnail ? (
                <img src={activeProduct.thumbnail} alt={activeProduct.title} className="checkout-image" />
              ) : (
                <div className="checkout-image-placeholder"><ShoppingBag size={32} /></div>
              )}
              <div className="checkout-product-info">
                <h4>{activeProduct.title?.length > 40 ? activeProduct.title.substring(0, 40) + "..." : activeProduct.title}</h4>
                <div className="checkout-brand">{activeProduct.source}</div>
                <div className="checkout-price">
                  {"merchantPriceLabel" in activeProduct
                    ? activeProduct.merchantPriceLabel
                    : activeProduct.price}
                </div>
              </div>
            </div>

            <div className="checkout-details">
              {checkoutSession && (
                <div className="checkout-meta">
                  <span className="meta-pill">{getCheckoutBadgeLabel(checkoutSession.status)}</span>
                  <span>Checkout ID: {checkoutSession.id.slice(0, 8)}</span>
                  <span>Expires: {new Date(checkoutSession.expiresAt).toLocaleTimeString()}</span>
                </div>
              )}
              <div className="detail-row">
                <span>Merchant Listing</span>
                <span>
                  {"merchantPriceLabel" in activeProduct
                    ? activeProduct.merchantPriceLabel
                    : activeProduct.price}
                </span>
              </div>
              <div className="detail-row">
                <span>Demo Merchant</span>
                <span>{checkoutSession?.merchant.label || "Buybird Demo Merchant"}</span>
              </div>
              <div className="detail-row">
                <span>Shipping</span>
                <span>{checkoutSession?.pricing.shippingLabel || "Calculated at next step"}</span>
              </div>
              <div className="detail-row">
                <span>Agent Fee</span>
                <span>{checkoutSession?.pricing.feeLabel || "Free"}</span>
              </div>
              <div className="detail-divider" />
              <div className="detail-row total">
                <span>Devnet Test Settlement</span>
                <span>{getSettlementTotalLabel(checkoutSession)}</span>
              </div>
              <p className="checkout-helper">
                {checkoutSession?.note || "Buybird snapshots the live product first, then creates an internal demo checkout for devnet payment testing."}
              </p>
              <p className="checkout-helper">
                This is not real mainnet USDC. It is devnet test USDC used to prove the payment flow safely.
              </p>

              {checkoutSession && (
                <>
                  <div className="wallet-header-row">
                    <label className="wallet-label" htmlFor="wallet-address">
                    Buyer wallet
                    </label>
                    <span className={`wallet-state-pill ${connected ? "connected" : "disconnected"}`}>
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <div
                    id="wallet-address"
                    className={`wallet-readout ${connectedWalletAddress ? "connected" : ""}`}
                  >
                    <span className="wallet-readout-label">
                      <WalletCards size={16} />
                      {connected ? `${walletLabel} connected` : "No wallet connected"}
                    </span>
                    <strong>
                      {connectedWalletAddress
                        ? `${connectedWalletAddress.slice(0, 6)}...${connectedWalletAddress.slice(-4)}`
                        : "Connect Phantom to continue"}
                    </strong>
                  </div>
                </>
              )}

              {checkoutSession?.payment.request && !isPaymentComplete && (
                <div className="payment-preview">
                  <div className="payment-preview-row">
                    <span>Payment route</span>
                    <strong>{checkoutSession.payment.mode === "live" ? "Private transfer" : "Demo transfer"}</strong>
                  </div>
                  <div className="payment-preview-row">
                    <span>Network</span>
                    <strong>Solana devnet</strong>
                  </div>
                  <div className="payment-preview-row">
                    <span>Merchant destination</span>
                    <strong>
                      {(
                        checkoutSession.payment.receiverTokenAccount || checkoutSession.merchant.wallet
                      ).slice(0, 6)}
                      ...
                      {(
                        checkoutSession.payment.receiverTokenAccount || checkoutSession.merchant.wallet
                      ).slice(-4)}
                    </strong>
                  </div>
                  <div className="payment-preview-row">
                    <span>Ready status</span>
                    <strong>{checkoutSession.payment.response?.transactionBase64 ? "Wallet approval ready" : "Demo mode"}</strong>
                  </div>
                </div>
              )}

            </div>

            <div className="checkout-actions">
              {!isPaymentComplete ? (
                <>
                  {!connected && (
                    <button
                      className="btn-wallet-connect"
                      type="button"
                      onClick={() => setWalletModalVisible(true)}
                    >
                      Connect wallet
                    </button>
                  )}
                  <button
                    className="btn-magicblock-pay"
                    type="button"
                    disabled={!checkoutSession || !connectedWalletAddress || isPreparingPayment || isCreatingCheckout || connecting}
                    onClick={handlePreparePayment}
                  >
                    {isCreatingCheckout
                      ? "Creating checkout..."
                      : isPreparingPayment
                        ? "Preparing private payment..."
                        : connected
                          ? "1. Prepare Private Payment"
                          : "Connect wallet to continue"}
                  </button>
                  <button
                    className="btn-magicblock-submit"
                    type="button"
                    disabled={
                      !checkoutSession?.payment.request ||
                      !connected ||
                      connecting ||
                      isPreparingPayment ||
                      isSubmittingPayment
                    }
                    onClick={handleSignAndSubmit}
                  >
                    {isSubmittingPayment
                      ? "Approving and sending..."
                      : checkoutSession?.payment.mode === "simulated" ||
                          !checkoutSession?.payment.response?.transactionBase64
                        ? "2. Complete Demo Payment"
                        : "2. Buy Now in Phantom"}
                  </button>
                </>
              ) : (
                <div className="payment-preview">
                  <div className="payment-preview-row">
                    <span>Payment status</span>
                    <strong>Sent</strong>
                  </div>
                  <div className="payment-preview-row">
                    <span>Network</span>
                    <strong>Solana devnet</strong>
                  </div>
                  <div className="payment-preview-row">
                    <span>Asset</span>
                    <strong>{settlementTokenLabel}</strong>
                  </div>
                </div>
              )}
              {checkoutError && <p className="checkout-alert error-text">{checkoutError}</p>}
              {checkoutNotice && <p className="checkout-alert success-text">{checkoutNotice}</p>}
              {!isPaymentComplete && (
                <p className="checkout-note">
                  <Sparkles size={12} /> Step 1 prepares the transfer. Step 2 asks your wallet to approve and send it.
                </p>
              )}
            </div>

            {isPaymentComplete && checkoutReceipt && (
              <div className="checkout-success-layer" role="dialog" aria-modal="true" aria-labelledby="success-title">
                <div className="checkout-success-card">
                  <div className="checkout-success-top">
                    <span className="meta-pill">transfer sent</span>
                    <button
                      type="button"
                      className="close-btn"
                      aria-label="Close success dialog"
                      onClick={resetCheckoutState}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <h4 id="success-title" className="receipt-title">Private payment sent successfully</h4>
                  <p className="checkout-helper checkout-helper-tight">
                    Your wallet approved the MagicBlock private transfer and the devnet transaction is now recorded.
                  </p>
                  <div className="checkout-success-grid">
                    <div className="checkout-success-row">
                      <span>Checkout</span>
                      <strong>{String(checkoutReceipt.checkoutId).slice(0, 8)}</strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>Status</span>
                      <strong>{String(checkoutReceipt.status)}</strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>Network</span>
                      <strong>Solana devnet</strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>Asset used</span>
                      <strong>{settlementTokenLabel}</strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>Signature</span>
                      <strong>{String(checkoutReceipt.signature).slice(0, 18)}...</strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>You paid</span>
                      <strong>
                        {checkoutSession
                          ? `${checkoutSession.pricing.settlementUiAmount.toFixed(2)} ${settlementTokenLabel}`
                          : "Recorded on devnet"}
                      </strong>
                    </div>
                    <div className="checkout-success-row">
                      <span>Merchant destination</span>
                      <strong>Private transfer completed</strong>
                    </div>
                  </div>
                  <div className="receipt-links">
                    <a
                      href={getTransactionExplorerUrl(String(checkoutReceipt.signature))}
                      target="_blank"
                      rel="noreferrer"
                      className="receipt-link"
                    >
                      Open transaction on Solscan
                    </a>
                    <a
                      href={receiverExplorer.href}
                      target="_blank"
                      rel="noreferrer"
                      className="receipt-link"
                    >
                      {receiverExplorer.label}
                    </a>
                  </div>
                  <button
                    type="button"
                    className="btn-magicblock-submit checkout-success-done"
                    onClick={resetCheckoutState}
                  >
                    Done
                  </button>
                  <p className="checkout-helper checkout-helper-tight">
                    This screen is showing proof that your payment was sent. The second Solscan link opens the merchant&apos;s receiving token account.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </>
      )}
    </main>
  );
}
