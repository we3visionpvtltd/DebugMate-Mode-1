import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Card } from 'react-bootstrap';
import { FaComments, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import { MyContext } from '../../App';
import './Communication.css';
import { generateCustomUUID } from '../../utils/customUUID';

function Communication() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Communication Assistant. I can help you with general questions, discussions, and provide information on various topics. How can I assist you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const context = useContext(MyContext);
  const userEmail = context.userEmail;
  const userName = context.userName || "User"; // fallback if name not available

  // ✅ Auto scroll to bottom when messages change
  useEffect(() => {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages]);

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Save to localStorage for communication chat
  const storageKey = 'chatHistory_communication';

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(chatHistory));
      console.log('💾 Communication chat history saved to localStorage:', storageKey, chatHistory.length, 'items');
    }
  }, [chatHistory, storageKey]);

  // Restore chat history from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChatHistory(parsed);
          console.log('🔄 Communication chat history restored:', parsed.length, 'items');
        }
      } catch (e) {
        console.error("Failed to parse communication chat history", e);
      }
    } else {
      console.log('🔍 No saved communication chat history found for key:', storageKey);
    }
  }, [storageKey]);

  // Redirect if no user email
  useEffect(() => {
    if (!userEmail) {
      navigate('/login');
    }
  }, [userEmail, navigate]);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setHistoryOpen(false); // 👈 start closed on mobile
      } else {
        setHistoryOpen(true); // 👈 keep open on desktop
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  // ✅ Call /set_session when component mounts or when userEmail changes
  useEffect(() => {
    const setSession = async () => {
      if (!userEmail) return;
      try {
        await fetch("https://krishnathummae17-debug-chatbot.hf.space/set_session", {
          method: "POST",
          headers: { "Content-Type": "application/json","Authorization": "Bearer debugmate123"  },
          credentials: "include",
          body: JSON.stringify({ email: userEmail, name: userName })
        });
        console.log("✅ Session set successfully in Flask");
      } catch (error) {
        console.error("❌ Failed to set session:", error);
      }
    };
    setSession();
  }, [userEmail, userName]);

  // Send message
  const sendMessage = async () => {
    if (inputText.trim() === '') return;
  
    const newMessage = { role: 'user', content: inputText };
    setInputText('');
  
    // Append user message immediately
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
  
    // Generate session ID if this is the first message
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = generateCustomUUID();
      setCurrentSessionId(sessionId);
    }
    setSessionActive(true);
  
    setIsTyping(true);
  
    try {
      const response = await fetch('https://krishnathummae17-debug-chatbot.hf.space/chat/common', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',"Authorization": "Bearer debugmate123"  },
        credentials: 'include',
        body: JSON.stringify({ query: newMessage.content })
      });
  
      const data = await response.json();
      const botReply = { role: 'assistant', content: data.reply || "⚠️ No reply from server" };
  
      // Append bot reply to messages
      const messagesWithBot = [...updatedMessages, botReply];
      setMessages(messagesWithBot);
  
      // Save chat history
      setChatHistory(prev => {
        const existing = prev.find(chat => chat.sessionId === sessionId);
        if (existing) {
          return prev.map(chat =>
            chat.sessionId === sessionId
              ? {
                  ...chat,
                  fullChat: messagesWithBot,
                  timestamp: new Date().toISOString(),
                  messageCount: messagesWithBot.length
                }
              : chat
          );
        } else {
          return [
            ...prev,
            {
              id: sessionId,
              sessionId: sessionId,
              chatType: 'communication',
              summary: newMessage.content,
              fullChat: messagesWithBot,
              timestamp: new Date().toISOString(),
              sessionName: `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
              messageCount: messagesWithBot.length
            }
          ];
        }
      });
  
    } catch (error) {
      console.error("❌ Chat request failed:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to chatbot.' }]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };




  const handleHistoryClick = (chat) => {
    setMessages(chat.fullChat);
    setCurrentSessionId(chat.sessionId);
    setSessionActive(true);
  };

  const handleHistoryDelete = (id) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  };

  return (
    <div className="communication-layout">
      {/* Main Chat Area */}
      <div className={`communication-container${historyOpen ? ' with-history' : ' full-width'}`}>
        <Card className="communication-card">
          <Card.Header className="d-flex align-items-center">
            <FaComments className="me-2" />
            <span>Communication Assistant</span>
          </Card.Header>

          <div className="communication-banner" style={{
            background: 'linear-gradient(135deg, #A80C4C, #090939, #421256, #531C9B)',
            color: 'white',
            padding: '12px 20px',
            fontSize: '14px',
          }}>
            <strong>Communication Assistant</strong>
            <span style={{ marginLeft: '10px', opacity: 0.8 }}>
              General questions, discussions, and information
            </span>
          </div>

          <Card.Body id="chatBox" className="communication-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`communication-bubble ${msg.role}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
          </Card.Body>

          <Card.Footer>
            <div className="communication-input-area">
              <div className="input-wrapper">
                <button className="attach-btn"><FaPaperclip /></button>
                <input
                  type="text"
                  placeholder="Ask general questions..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={sendMessage} aria-label="Send message" title="Send">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </Card.Footer>
        </Card>
      </div>

      {/* History Panel */}
      <div className={`communication-history-panel${historyOpen ? '' : ' closed'}`}>
        <div className="communication-panel-header">
          <h3>Communication History</h3>
        </div>
        <div className="communication-history-list">
          {chatHistory.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No previous sessions</p>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`communication-history-item${messages === chat.fullChat ? ' selected' : ''}`}
                onClick={() => handleHistoryClick(chat)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div className="communication-history-type-badge">
                      Session
                    </div>
                    <button
                      className="communication-history-delete-btn"
                      onClick={e => { e.stopPropagation(); handleHistoryDelete(chat.id); }}
                      style={{ marginLeft: '8px', marginTop: '-6px' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="communication-history-session-name">
                    {chat.sessionName || `Session ${new Date(chat.timestamp).toLocaleDateString()}`}
                  </div>
                  <span className="communication-history-summary">{chat.summary}</span>
                  <div className="communication-history-meta">
                    {chat.messageCount && (
                      <small style={{ display: 'inline-block', color: '#666', fontSize: '10px', marginRight: '10px' }}>
                        {chat.messageCount} messages
                      </small>
                    )}
                    <small style={{ color: '#666', fontSize: '10px' }}>
                      {new Date(chat.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Toggle Button */}
      <button
        className="communication-history-toggle-btn"
        onClick={() => setHistoryOpen(prev => !prev)}
      >
        {historyOpen ? '→' : '←'}
      </button>
    </div>
  );
}

export default Communication;
