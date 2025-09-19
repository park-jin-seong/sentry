import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';
import throttle from 'lodash/throttle';
import {Virtuoso} from "react-virtuoso";
import './Chat.css';
import Message from './Message';

const currentUserId = 1;

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
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

    const fetchMessages = async (lastMessageId) => {
        if (isLoadingMessages.current || !hasMore) return;
        isLoadingMessages.current = true;

        if (lastMessageId) {
            prevScrollHeight.current = chatContainerRef.current.scrollHeight;
        }

        try {
            const response = await axios.get('http://localhost:8080/room/1', {
                params: { lastMessageId: lastMessageId }
            });

            const newMessages = response.data.content;
            setHasMore(!response.data.last);

            if (newMessages.length > 0) {
                setMessages(prevMessages => [...prevMessages, ...newMessages]);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            isLoadingMessages.current = false;
        }
    };

    useEffect(() => {
        fetchMessages(null);
    }, []);

    useEffect(() => {
        if (messages.length > 0 && chatContainerRef.current) {
            if (isScrolledToBottom.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            } else if (prevScrollHeight.current !== null) {
                const newScrollHeight = chatContainerRef.current.scrollHeight;
                chatContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
                prevScrollHeight.current = null;
            }
        }
    }, [messages]);

    useEffect(() => {
        const chatDiv = chatContainerRef.current;
        if (!chatDiv) return;

        const handleScroll = () => {
            const { scrollTop } = chatDiv;

            if (scrollTop <= 5 && !isLoadingMessages.current && hasMore) {
                const lastMessage = messagesRef.current[messagesRef.current.length - 1];
                const lastMessageId = lastMessage?.messageId;

                if (lastMessageId) {
                    fetchMessages(lastMessageId);
                }
            }
            isScrolledToBottom.current = (chatDiv.scrollHeight - chatDiv.scrollTop - chatDiv.clientHeight < 5);
        };

        const throttledHandleScroll = throttle(handleScroll, 200);
        chatDiv.addEventListener('scroll', throttledHandleScroll);

        return () => {
            chatDiv.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [hasMore]);

    useEffect(() => {
        const serverUrl = 'http://localhost:8080/chat';
        const subscribeUrl = '/room/1';

        const sock = new SockJS(serverUrl);
        const stompClient = Stomp.over(sock);
        stompClient.debug = null;

        stompClient.connect({}, (frame) => {
            console.log('Connected: ' + frame);
            stompClientRef.current = stompClient;

            stompClient.subscribe(subscribeUrl, (message) => {
                const messageBody = JSON.parse(message.body);
                setMessages(prevMessages => {
                    const isOptimistic = prevMessages.some(msg => msg.optimisticId === messageBody.optimisticId);
                    if (isOptimistic) {
                        return prevMessages.map(msg => msg.optimisticId === messageBody.optimisticId ? messageBody : msg);
                    } else {
                        return [messageBody, ...prevMessages];
                    }
                });
            });
        }, (error) => {
            console.log('Connection error: ' + error);
        });

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    const sendMessage = () => {
        const publishUrl = '/send/1';
        const roomId = 1;
        const senderId = currentUserId;
        const senderNickname = '(임시 닉네임)';
        const optimisticId = Date.now();

        if (messageInput.trim() && stompClientRef.current) {
            const messageDTO = {
                roomId: roomId,
                senderId: senderId,
                content: messageInput,
                optimisticId: optimisticId,
            };

            const tmpMessage = {
                optimisticId: optimisticId,
                senderId: senderId,
                senderNickname: senderNickname,
                content: messageInput,
                createdAt: new Date().toISOString()
            };
            setMessages(prevMessages => [tmpMessage, ...prevMessages]);

            stompClientRef.current.send(publishUrl, {}, JSON.stringify(messageDTO));
            setMessageInput('');
        }
    };



    return (
        <div className="chat-container">
            <div className="chat-messages" ref={chatContainerRef}>
                {messages.slice().reverse().map((msg) => (
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
                />
                <button onClick={sendMessage}>
                    전송
                </button>
            </div>
        </div>
    );
};

export default Chat;