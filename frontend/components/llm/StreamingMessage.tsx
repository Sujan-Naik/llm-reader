import BaseMessageBubble from './BaseMessageBubble';

interface StreamingMessageProps {
    content: string;
}

export default function StreamingMessage({content}: StreamingMessageProps) {
    return (
        <BaseMessageBubble
            role="assistant"
            content={content}
            isStreaming
        />
    );
}
