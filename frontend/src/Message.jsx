const Message = ({ msg, currentUserId }) => {
     const isMyMessage = currentUserId && msg.senderId &&
           String(msg.senderId) === String(currentUserId);

    return (
        <div
            key={msg.messageId || msg.id || msg.optimisticId}
            className={`message-container ${isMyMessage ? 'my-message' : 'other-message'}`}
        >
            <div className="message-bubble">
                {!isMyMessage && <strong>{msg.senderNickname}</strong>}
                <p>{msg.content}</p>
                <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

export default Message;