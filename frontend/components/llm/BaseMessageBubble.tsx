import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface BaseMessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    isStreaming?: boolean;
}

export default function BaseMessageBubble({role, content, timestamp, isStreaming}: BaseMessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                flexDirection: isUser ? "row-reverse" : "row",
                justifyContent: 'flex-start',
                width: "100%",
                minHeight: "auto",
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    backgroundColor: isUser ? 'var(--highlight)' : 'green',
                }}
            >
                {isUser ? 'U' : 'AI'}
            </div>

            {/* Message bubble */}
            <div
                style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: 'var(--border-radius-large)',
                    fontSize: 15,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    backgroundColor: isUser
                        ? 'var(--highlight)'
                        : 'var(--background-secondary)',
                    color: isUser ? 'var(--foreground-tertiary)' : 'var(--foreground-secondary)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {isUser ? (
                    <pre
                        style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'inherit',
                            margin: 0,
                            overflow: 'visible',
                        }}
                    >
            {content}
          </pre>
                ) : (
                    <ReactMarkdown
                        components={{
                            code: CodeBlock,
                            pre: ({children, ...props}) => (
                                <pre
                                    {...props}
                                    style={{
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        margin: '0',
                                        maxWidth: '100%',
                                    }}
                                >
                  {children}
                </pre>
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}

                {/* Footer */}
                {isStreaming ? (
                    <div
                        style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'green',
                            borderRadius: '50%',
                            marginLeft: '4px',
                            marginTop: '8px',
                        }}
                    />
                ) : timestamp ? (
                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.7,
                            marginTop: 8,
                            textAlign: isUser ? 'right' : 'left',
                        }}
                    >
                        {timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
