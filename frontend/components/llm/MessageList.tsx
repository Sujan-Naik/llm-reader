import React, {useEffect, useMemo, useRef} from 'react';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';
import {Message} from '@/types/messages';
import MessageBubble from './MessageBubble';
import StreamingMessage from './StreamingMessage';

interface MessageListProps {
    messages: Message[];
    currentResponse: string;
    focusStreaming: boolean;
    behavior: 'auto' | 'smooth';
}

type DisplayMessage = Message | { id: string; role: 'assistant'; content: string; timestamp?: Date };

export default function MessageList({messages, currentResponse, focusStreaming, behavior}: MessageListProps) {
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Merge messages with a streaming message if any
    const displayMessages: DisplayMessage[] = useMemo(() => {
        if (currentResponse) {
            const lastUser = messages[messages.length - 1];
            return [
                ...messages,
                {
                    id: `streaming-${lastUser?.id ?? 'temp'}`,
                    role: 'assistant',
                    content: currentResponse,
                    timestamp: new Date(),
                },
            ];
        }
        return messages;
    }, [messages, currentResponse]);

    // 👇 Force scroll when streaming updates
    useEffect(() => {
        if (focusStreaming && currentResponse) {
            virtuosoRef.current?.scrollToIndex({
                index: displayMessages.length - 1,
                behavior,
                align: 'end', // ensure we stick to the bottom of the last item
            });
        }
    }, [currentResponse, focusStreaming, behavior, displayMessages.length]);

    return (
        <div style={{height: '100%', boxSizing: 'border-box', display: 'block', overflow: 'hidden'}}>
            {/* Virtuoso message list */}
            <Virtuoso
                ref={virtuosoRef}
                style={{height: '100%', width: '100%'}}
                data={displayMessages}
                followOutput={false} // we control scroll manually
                computeItemKey={(index) => displayMessages[index].id}
                itemContent={(index, message) => {
                    const isStreaming = message.id.startsWith('streaming');
                    return (
                        <div
                            style={{
                                paddingBottom: index < displayMessages.length - 1 ? '16px' : '8px',
                                width: '100%',
                                display: 'block',
                            }}
                        >
                            {isStreaming ? (
                                <StreamingMessage content={message.content}/>
                            ) : (
                                <MessageBubble message={message as Message}/>
                            )}
                        </div>
                    );
                }}
                components={{
                    Item: (props) => (
                        <div {...props} style={{...props.style, display: 'block', boxSizing: 'border-box'}}/>
                    ),

                }}
            />
        </div>
    );
}
