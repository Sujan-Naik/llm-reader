import {useState} from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {tomorrow} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {HeadedButton, VariantEnum} from "headed-ui";

interface CodeBlockProps {
    className?: string;
    children?: React.ReactNode;
}

export default function CodeBlock({className, children}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');

    const copyCode = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (match) {
        return (
            <div style={{display: 'flex', flexDirection: 'column', position: 'relative'}}>
                <div style={{
                    overflow: 'auto',  // Allow scrolling for long lines
                    whiteSpace: 'pre-wrap', // Preserve spaces and allow wrapping
                    wordBreak: 'break-word', // Break long words
                    padding: '10px', // Optional: padding for better spacing
                    borderRadius: '5px', // Optional: rounded corners
                    maxWidth: '100%', // Ensure it doesn't exceed container width
                }}>
                    <SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="div">
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
                <HeadedButton variant={VariantEnum.Secondary} onClick={copyCode}>
                    {copied ? 'Copied!' : 'Copy'}
                </HeadedButton>
            </div>
        );
    }

    return (
        <code>
            {children}
        </code>
    );
}