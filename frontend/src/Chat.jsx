// src/components/chat/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import axios from "axios";
import throttle from "lodash/throttle";
import "./Chat.css";
import Message from "./Message";
import { api } from "./lib/api.js";
import { useAuth } from "./auth.jsx";

const Chat = () => {
    const { me } = useAuth();
    const currentUserId = me && me.id ? String(me.id) : null;

    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [composing, setComposing] = useState(false); // ⬅️ IME 한글 조합 여부
    const [connected, setConnected] = useState(false);

    const stompClientRef = useRef(null);
    const chatContainerRef = useRef(null);

    const isScrolledToBottom = useRef(true);
    const isLoadingMessages = useRef(false);
    const prevScrollHeight = useRef(null);
    const [hasMore, setHasMore] = useState(true);

    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // 초기/무한스크롤 메시지 조회
    const fetchMessages = async (lastMessageId) => {
        if (isLoadingMessages.current || !hasMore) return;
        isLoadingMessages.current = true;

        if (lastMessageId && chatContainerRef.current) {
            prevScrollHeight.current = chatContainerRef.current.scrollHeight;
        }

        try {
            const token = api.peekAccessToken();
            if (!token) {
                console.error("토큰이 없어 메시지를 불러올 수 없습니다.");
                return;
            }

            const res = await axios.get("http://localhost:8080/room/1", {
                params: { lastMessageId },
                headers: { Authorization: `Bearer ${token}` },
            });

            const raw = res.data?.content || [];
            const newMessages = raw.map((m) => ({
                ...m,
                messageId: m.messageId ?? m.id,
                senderId: m.senderId ?? m.userId,
                content: m.content ?? m.text,
                createdAt: m.createdAt ?? m.ts,
            }));

            setHasMore(!res.data?.last);

            if (newMessages.length > 0) {
                setMessages((prev) => {
                    const merged = [...prev, ...newMessages];
                    return merged.sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    );
                });
            }
        } catch (e) {
            console.error("Failed to fetch messages:", e);
        } finally {
            isLoadingMessages.current = false;
        }
    };

    useEffect(() => {
        fetchMessages(null);
    }, []);

    // 스크롤 유지
    useEffect(() => {
        if (!chatContainerRef.current || messages.length === 0) return;
        const el = chatContainerRef.current;

        if (isScrolledToBottom.current) {
            el.scrollTop = el.scrollHeight;
        } else if (prevScrollHeight.current !== null) {
            const newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - prevScrollHeight.current;
            prevScrollHeight.current = null;
        }
    }, [messages]);

    // 무한스크롤 핸들러
    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;

            // 상단 근처 → 과거 메시지 추가 로딩
            if (scrollTop <= 5 && !isLoadingMessages.current && hasMore) {
                const oldest = messagesRef.current[0];
                const lastId = oldest?.messageId ?? oldest?.id;
                if (lastId) fetchMessages(lastId);
            }

            // 하단 고정 여부 업데이트
            isScrolledToBottom.current = scrollHeight - scrollTop - clientHeight < 5;
        };

        const throttled = throttle(handleScroll, 200);
        el.addEventListener("scroll", throttled);
        return () => el.removeEventListener("scroll", throttled);
    }, [hasMore]);

    // 소켓 연결/구독
    useEffect(() => {
        const serverUrl = "http://localhost:8080/chat";
        const subscribeUrl = "/room/1";

        const sock = new SockJS(serverUrl);
        const stompClient = Stomp.over(sock);
        stompClient.debug = null;

        const token = api.peekAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        stompClient.connect(
            headers,
            (frame) => {
                console.log("Connected:", frame);
                stompClientRef.current = stompClient;
                setConnected(true);

                stompClient.subscribe(subscribeUrl, (message) => {
                    const messageBody = JSON.parse(message.body);

                    setMessages((prev) => {
                        let updated = [...prev];

                        // 1) optimisticId로 낙관적 메시지 교체
                        if (messageBody.optimisticId) {
                            const idx = updated.findIndex(
                                (m) => m.optimisticId === messageBody.optimisticId
                            );
                            if (idx !== -1) {
                                return [
                                    ...updated.slice(0, idx),
                                    { ...updated[idx], ...messageBody },
                                    ...updated.slice(idx + 1),
                                ];
                            }
                        }

                        // 2) messageId(DB PK) 중복 방지
                        if (messageBody.messageId) {
                            const exists = updated.some(
                                (m) => m.messageId === messageBody.messageId
                            );
                            if (exists) return updated;
                        }

                        // 3) 신규 추가
                        return [...updated, messageBody];
                    });
                });
            },
            (error) => {
                console.log("Connection error:", error);
                setConnected(false);
            }
        );

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
                setConnected(false);
            }
        };
    }, []);

    // 전송
    const sendMessage = () => {
        if (!stompClientRef.current) return;

        const text = messageInput.trim();
        if (!text) return;

        const publishUrl = "/send/chat/1";
        const optimisticId = Date.now();

        const messageDTO = {
            content: text,
            optimisticId,
        };

        const tmpMessage = {
            optimisticId,
            senderId: currentUserId,
            senderNickname: "(임시 닉네임)",
            content: text,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tmpMessage]);
        stompClientRef.current.send(publishUrl, {}, JSON.stringify(messageDTO));
        setMessageInput("");

        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    return (
        <div id="chat-root" className="chat-shell">
            <div className="chat-container">
                <div className="chat-messages" ref={chatContainerRef}>
                    {messages.map((msg) => (
                        <Message
                            key={msg.messageId || msg.optimisticId}
                            msg={msg}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        id="messageInput"
                        placeholder="메시지를 입력하세요"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onCompositionStart={() => setComposing(true)}   // 한글 조합 시작
                        onCompositionEnd={() => setComposing(false)}    // 한글 조합 끝
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                // 조합 중이면 무시 (브라우저별 보강)
                                if (composing || e.nativeEvent.isComposing) return;
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <button onClick={sendMessage} disabled={!connected || !messageInput.trim()}>
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
