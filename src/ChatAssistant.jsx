import { useEffect, useRef, useState } from 'react'
import { translate, translateApiError } from './translations.js'
import './ChatAssistant.css'

const defaultChatSize = { width: 390, height: 570 }

function clampChatSize(size) {
  const maxWidth = Math.max(280, Math.min(900, window.innerWidth - 32))
  const maxHeight = Math.max(260, Math.min(900, window.innerHeight - 100))
  return {
    width: Math.round(Math.min(maxWidth, Math.max(Math.min(320, maxWidth), size.width))),
    height: Math.round(Math.min(maxHeight, Math.max(Math.min(300, maxHeight), size.height))),
  }
}

function FieldnoteMark({ className }) {
  return <span className={`${className} fieldnote-mark`} aria-hidden="true" />
}

function formatInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function AssistantMessage({ text }) {
  const lines = text.split(/\r?\n/)
  const blocks = []
  let lineIndex = 0

  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim()
    if (!line) {
      lineIndex += 1
      continue
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading) {
      blocks.push(<strong className="ai-message-heading" key={lineIndex}>{formatInlineMarkdown(heading[1])}</strong>)
      lineIndex += 1
      continue
    }

    const listItem = line.match(/^(?:[-*]\s+|\d+[.)]\s+)(.+)$/)
    if (listItem) {
      const listStart = lineIndex
      const listItems = []
      while (lineIndex < lines.length) {
        const item = lines[lineIndex].trim().match(/^(?:[-*]\s+|\d+[.)]\s+)(.+)$/)
        if (!item) break
        listItems.push(<li key={lineIndex}>{formatInlineMarkdown(item[1])}</li>)
        lineIndex += 1
      }
      const isOrderedList = /^\d+[.)]\s+/.test(line)
      const List = isOrderedList ? 'ol' : 'ul'
      blocks.push(<List key={listStart}>{listItems}</List>)
      continue
    }

    const paragraphStart = lineIndex
    const paragraphLines = []
    while (lineIndex < lines.length) {
      const paragraphLine = lines[lineIndex].trim()
      if (!paragraphLine || /^#{1,3}\s+/.test(paragraphLine) || /^(?:[-*]\s+|\d+[.)]\s+)/.test(paragraphLine)) break
      paragraphLines.push(paragraphLine)
      lineIndex += 1
    }
    blocks.push(<p key={paragraphStart}>{formatInlineMarkdown(paragraphLines.join(' '))}</p>)
  }

  return <div className="ai-message-content">{blocks}</div>
}

function getSavedChatSize() {
  try {
    const savedSize = JSON.parse(localStorage.getItem('fieldnote-ai-chat-size') || 'null')
    if (
      savedSize
      && Number.isFinite(savedSize.width)
      && Number.isFinite(savedSize.height)
    ) {
      return clampChatSize(savedSize)
    }
  } catch {
    // Use the default size if browser storage is unavailable or invalid.
  }
  return clampChatSize(defaultChatSize)
}

function ChatAssistant({ language }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [includeScreenshot, setIncludeScreenshot] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [chatSize, setChatSize] = useState(getSavedChatSize)
  const messageListRef = useRef(null)
  const inputRef = useRef(null)
  const resizeStartRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('fieldnote-ai-chat-size', JSON.stringify(chatSize))
    } catch {
      // Resizing still works for this session when browser storage is unavailable.
    }
  }, [chatSize])

  useEffect(() => {
    function keepChatOnScreen() {
      setChatSize((size) => clampChatSize(size))
    }

    window.addEventListener('resize', keepChatOnScreen)
    return () => window.removeEventListener('resize', keepChatOnScreen)
  }, [])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [isOpen, messages, isSending])

  async function sendMessage(event) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || isSending) return

    setError('')
    setIsSending(true)

    try {
      let screenshot
      if (includeScreenshot) {
        const app = document.querySelector('.exam-app')
        if (!app) throw new Error('SCREEN_CAPTURE_FAILED')

        try {
          const { default: html2canvas } = await import('html2canvas')
          const scale = Math.min(1, 1024 / window.innerWidth, 900 / window.innerHeight)
          const canvas = await html2canvas(app, {
            backgroundColor: null,
            height: window.innerHeight,
            ignoreElements: (element) => element.classList?.contains('ai-assistant'),
            scale,
            useCORS: true,
            width: window.innerWidth,
            windowHeight: window.innerHeight,
            windowWidth: document.documentElement.clientWidth,
            x: 0,
            y: window.scrollY,
          })
          screenshot = canvas.toDataURL('image/jpeg', 0.55)
          if (screenshot.length > 250_000) throw new Error('SCREEN_CAPTURE_TOO_LARGE')
        } catch {
          throw new Error('SCREEN_CAPTURE_FAILED')
        }
      }

      const history = messages.slice(-10)
      if (history[0]?.role === 'model') history.shift()
      if (history.at(-1)?.role === 'user') history.pop()

      setDraft('')
      setMessages((previous) => [...previous, { role: 'user', text: message }])

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language,
          history: history.map(({ role, text }) => ({ role, text })),
          ...(screenshot ? { screenshot } : {}),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(translateApiError(language, data.error) || translate(language, 'aiError'))
      }

      setMessages((previous) => [...previous, { role: 'model', text: data.reply }])
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : ''
      if (messageText === 'SCREEN_CAPTURE_FAILED') {
        setError(translate(language, 'aiScreenshotError'))
      } else {
        setError(messageText === 'Failed to fetch'
          ? translate(language, 'aiNetworkError')
          : messageText || translate(language, 'aiError'))
      }
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  function clearConversation() {
    setMessages([])
    setError('')
  }

  function startResize(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      ...chatSize,
    }
  }

  function updateResize(event) {
    if (!resizeStartRef.current) return
    const start = resizeStartRef.current
    setChatSize(clampChatSize({
      width: start.width + start.x - event.clientX,
      height: start.height + start.y - event.clientY,
    }))
  }

  function finishResize() {
    resizeStartRef.current = null
  }

  function resizeByKeyboard(event) {
    const step = event.shiftKey ? 48 : 16
    const sizeChanges = {
      ArrowLeft: { width: step },
      ArrowRight: { width: -step },
      ArrowUp: { height: step },
      ArrowDown: { height: -step },
    }[event.key]

    if (event.key === 'Home') {
      event.preventDefault()
      setChatSize(clampChatSize(defaultChatSize))
    } else if (sizeChanges) {
      event.preventDefault()
      setChatSize((size) => clampChatSize({
        ...size,
        width: size.width + (sizeChanges.width ?? 0),
        height: size.height + (sizeChanges.height ?? 0),
      }))
    }
  }

  return (
    <div className="ai-assistant">
      {isOpen && (
        <section
          className="ai-chat-panel"
          aria-label={translate(language, 'aiTitle')}
          style={{
            '--ai-chat-width': `${chatSize.width}px`,
            '--ai-chat-height': `${chatSize.height}px`,
          }}
        >
          <button
            type="button"
            className="ai-resize-handle"
            aria-label={translate(language, 'aiResize')}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Home"
            title={translate(language, 'aiResizeHint')}
            onPointerDown={startResize}
            onPointerMove={updateResize}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            onKeyDown={resizeByKeyboard}
          >
            <span aria-hidden="true">⌞</span>
          </button>
          <header className="ai-chat-header">
            <div className="ai-chat-heading">
              <FieldnoteMark className="ai-avatar" />
              <div>
                <h2>{translate(language, 'aiTitle')}</h2>
                <p>{translate(language, 'aiSubtitle')}</p>
              </div>
            </div>
            <div className="ai-chat-actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="ai-icon-button"
                  aria-label={translate(language, 'aiClear')}
                  title={translate(language, 'aiClear')}
                  onClick={clearConversation}
                >
                  ↻
                </button>
              )}
              <button
                type="button"
                className="ai-icon-button"
                aria-label={translate(language, 'aiClose')}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="ai-message-list" ref={messageListRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <FieldnoteMark className="ai-welcome-mark" />
                <p>{translate(language, 'aiWelcome')}</p>
                <span>{translate(language, 'aiDisclaimer')}</span>
              </div>
            )}
            {messages.map((item, index) => (
              <div className={`ai-message ai-message-${item.role}`} key={`${index}-${item.role}`}>
                {item.role === 'model' && <FieldnoteMark className="ai-message-mark" />}
                {item.role === 'model' ? <AssistantMessage text={item.text} /> : <p>{item.text}</p>}
              </div>
            ))}
            {isSending && (
              <div className="ai-message ai-message-model ai-typing" role="status">
                <FieldnoteMark className="ai-message-mark" />
                <p>{translate(language, 'aiThinking')}</p>
              </div>
            )}
          </div>

          {error && <p className="ai-error" role="alert">{error}</p>}

          <form className="ai-chat-form" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="ai-chat-input">{translate(language, 'aiInputLabel')}</label>
            <textarea
              id="ai-chat-input"
              ref={inputRef}
              value={draft}
              maxLength={2000}
              rows={2}
              placeholder={translate(language, 'aiPlaceholder')}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
            />
            <label className="ai-screenshot-option">
              <input
                type="checkbox"
                checked={includeScreenshot}
                onChange={(event) => setIncludeScreenshot(event.target.checked)}
              />
              <span>
                <strong>{translate(language, 'aiShareScreen')}</strong>
                <small>{translate(language, 'aiShareScreenHint')}</small>
              </span>
            </label>
            <div className="ai-form-footer">
              <span>{translate(language, 'aiEnterHint')}</span>
              <button
                type="submit"
                className="ai-send-button"
                disabled={!draft.trim() || isSending}
                aria-label={translate(language, 'aiSend')}
              >
                ↑
              </button>
            </div>
          </form>
        </section>
      )}
      <button
        type="button"
        className={`ai-launcher ${isOpen ? 'ai-launcher-open' : ''}`}
        aria-expanded={isOpen}
        aria-label={translate(language, isOpen ? 'aiClose' : 'aiOpen')}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? '×' : <><FieldnoteMark className="ai-launcher-mark" /><span>{translate(language, 'aiOpen')}</span></>}
      </button>
    </div>
  )
}

export default ChatAssistant
