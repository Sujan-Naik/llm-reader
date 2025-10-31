export const autoIndentCode = (text: string): string => {
    const lines = text.split('\n')
    const indentedLines = lines.map((line, index) => {
        if (index === 0) return line

        const codePatterns = [
            /^\s*(function|const|let|var|if|for|while|class|def|import|export)/,
            /^\s*[{}()[\];]/,
            /^\s*\/\/|^\s*\/\*|^\s*\*/,
            /^\s*<\/?[a-zA-Z]/,
            /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:]/
        ]

        const prevLine = lines[index - 1]
        const isCodeBlock = codePatterns.some(pattern => pattern.test(line) || pattern.test(prevLine))

        if (isCodeBlock && line.trim() && !line.startsWith('  ')) {
            return '  ' + line
        }

        return line
    })

    return indentedLines.join('\n')
}