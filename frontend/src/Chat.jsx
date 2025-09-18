import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const stompClientRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isScrolledToBottom = useRef(true);

    useEffect(() => {
        const fetchPastMessages = async () => {
            try {
                const response = await axios.get('http://localhost:8080/room/1');
                setMessages(response.data.content.reverse());
            } catch (error) {
                console.error("Failed to fetch past messages:", error);
            }
        };
        fetchPastMessages();
    }, []);

    useEffect(() => {
        if (messages.length > 0 && chatContainerRef.current) {
            if (isScrolledToBottom.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }
    }, [messages]);

    useEffect(() => {
        const chatDiv = chatContainerRef.current;
        if (!chatDiv) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = chatDiv;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                isScrolledToBottom.current = true;
            } else {
                isScrolledToBottom.current = false;
            }
        };

        chatDiv.addEventListener('scroll', handleScroll);

        return () => {
            chatDiv.removeEventListener('scroll', handleScroll);
        };
    }, []);

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
                        return [...prevMessages, messageBody];
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
        const senderId = 1;
        const senderNickname = '(로그인 구현 전 임시 닉네임)';
        const optimisticId = Date.now(); // 임시 ID 생성

        if (messageInput.trim() && stompClientRef.current) {
            const messageDTO = {
                roomId: roomId,
                senderId: senderId,
                content: messageInput,
                optimisticId: optimisticId,
            };

            const tmpMessage = {
                optimisticId: optimisticId,
                senderNickname: senderNickname,
                content: messageInput,
                createdAt: new Date().toISOString()
            };
            setMessages(prevMessages => [...prevMessages, tmpMessage]);

            stompClientRef.current.send(publishUrl, {}, JSON.stringify(messageDTO));
            setMessageInput('');
        }
    };

    return (
        <div>
            <div ref={chatContainerRef} style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px' }}>
                {messages.map((msg) => (
                    <p key={msg.messageId || msg.optimisticId}>
                        <strong>{msg.senderNickname}</strong>: {msg.content}
                        <span style={{ fontSize: '0.8em', color: '#888' }}>
                            &nbsp;({new Date(msg.createdAt).toLocaleString()})
                        </span>
                    </p>
                ))}
            </div>
            <div style={{ marginTop: '10px' }}>
                <input
                    type="text"
                    id="messageInput"
                    placeholder="메시지를 입력하세요"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                />
                <button onClick={sendMessage}>전송</button>
            </div>
        </div>
    );
};

export default Chat;