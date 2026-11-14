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

function getSpeechLanguage(language) {
  return { en: 'en-US', ja: 'ja-JP', th: 'th-TH' }[language] || 'en-US'
}

function getPreferredSpeechVoice(voices, locale) {
  const language = locale.split('-')[0].toLowerCase()
  const matchingVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(`${language}-`))
  const exactVoices = matchingVoices.filter((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
  const candidates = exactVoices.length > 0 ? exactVoices : matchingVoices

  return [...candidates].sort((first, second) => {
    function score(voice) {
      return (voice.name.toLowerCase().includes('google') ? 8 : 0)
        + (/\b(natural|neural|premium|enhanced)\b/i.test(voice.name) ? 4 : 0)
        + (voice.localService === false ? 2 : 0)
        + (voice.default ? 1 : 0)
    }

    return score(second) - score(first)
  })[0]
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
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const [speechVoices, setSpeechVoices] = useState([])
  const [selectedSpeechVoiceURI, setSelectedSpeechVoiceURI] = useState('')
  const [error, setError] = useState('')
  const [chatSize, setChatSize] = useState(getSavedChatSize)
  const messageListRef = useRef(null)
  const inputRef = useRef(null)
  const resizeStartRef = useRef(null)
  const recognitionRef = useRef(null)
  const speechBaseDraftRef = useRef('')
  const utteranceRef = useRef(null)
  const thaiSpeechVoices = speechVoices.filter((voice) => voice.lang.toLowerCase().startsWith('th-'))

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.onerror = null
      recognitionRef.current.abort()
    }
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    const speechSynthesis = window.speechSynthesis
    if (!speechSynthesis) return undefined

    function updateSpeechVoices() {
      setSpeechVoices(speechSynthesis.getVoices())
    }

    updateSpeechVoices()
    speechSynthesis.addEventListener('voiceschanged', updateSpeechVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', updateSpeechVoices)
  }, [])

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
    if (isListening) recognitionRef.current?.stop()

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

  async function regenerateResponse(responseIndex) {
    if (isSending) return

    const promptIndex = responseIndex - 1
    const prompt = messages[promptIndex]
    if (prompt?.role !== 'user') return

    const history = messages.slice(0, promptIndex).slice(-10)
    if (history[0]?.role === 'model') history.shift()

    setError('')
    setIsSending(true)
    setRegeneratingIndex(responseIndex)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt.text,
          language,
          history: history.map(({ role, text }) => ({ role, text })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(translateApiError(language, data.error) || translate(language, 'aiError'))
      }

      setMessages((previous) => previous.map((item, index) => (
        index === responseIndex ? { ...item, text: data.reply } : item
      )))
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : ''
      setError(messageText === 'Failed to fetch'
        ? translate(language, 'aiNetworkError')
        : messageText || translate(language, 'aiError'))
    } finally {
      setIsSending(false)
      setRegeneratingIndex(null)
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError(translate(language, 'aiSpeechUnavailable'))
      return
    }

    setError('')
    speechBaseDraftRef.current = draft

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = getSpeechLanguage(language)
      recognition.continuous = false
      recognition.interimResults = true
      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
        setDraft(`${speechBaseDraftRef.current}${speechBaseDraftRef.current ? ' ' : ''}${transcript}`)
      }
      recognition.onerror = (event) => {
        setIsListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(translate(language, 'aiMicPermission'))
        } else if (event.error === 'no-speech') {
          setError(translate(language, 'aiSpeechNoResult'))
        } else if (event.error !== 'aborted') {
          setError(translate(language, 'aiSpeechError'))
        }
      }
      recognition.onend = () => {
        setIsListening(false)
        if (recognitionRef.current === recognition) recognitionRef.current = null
      }
      recognitionRef.current = recognition
      recognition.start()
    } catch {
      recognitionRef.current = null
      setIsListening(false)
      setError(translate(language, 'aiSpeechError'))
    }
  }

  function toggleSpeech(text, index) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setError(translate(language, 'aiSpeechUnavailable'))
      return
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
      setSpeakingIndex(null)
      return
    }

    window.speechSynthesis.cancel()
    const locale = getSpeechLanguage(language)
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = locale
    utterance.rate = language === 'th' ? 0.9 : 0.95
    utterance.pitch = 1
    const availableVoices = speechVoices.length > 0 ? speechVoices : window.speechSynthesis.getVoices()
    const voice = availableVoices.find((candidate) => (
      language === 'th'
      && candidate.voiceURI === selectedSpeechVoiceURI
      && candidate.lang.toLowerCase().startsWith('th-')
    ))
      || getPreferredSpeechVoice(availableVoices, locale)
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null
        setSpeakingIndex(null)
      }
    }
    utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null
        setSpeakingIndex(null)
        setError(translate(language, 'aiSpeechError'))
      }
    }
    utteranceRef.current = utterance
    setSpeakingIndex(index)
    setError('')
    window.speechSynthesis.speak(utterance)
  }

  function clearConversation() {
    window.speechSynthesis?.cancel()
    utteranceRef.current = null
    setSpeakingIndex(null)
    setMessages([])
    setError('')
  }

  function closeChat() {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    utteranceRef.current = null
    setSpeakingIndex(null)
    setIsOpen(false)
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
                onClick={closeChat}
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
                {item.role === 'model' ? (
                  <div className="ai-message-body">
                    <AssistantMessage text={item.text} />
                    <div className="ai-message-actions">
                      <button
                        type="button"
                        className={`ai-regenerate-button${speakingIndex === index ? ' is-speaking' : ''}`}
                        aria-label={translate(language, speakingIndex === index ? 'aiStopSpeaking' : 'aiListen')}
                        title={translate(language, speakingIndex === index ? 'aiStopSpeaking' : 'aiListen')}
                        onClick={() => toggleSpeech(item.text, index)}
                      >
                        {speakingIndex === index ? (
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M5 4.5h2v7H5zM9 4.5h2v7H9z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M7 3.5 3.5 6H1.8v4h1.7L7 12.5zM9.5 6a3 3 0 0 1 0 4M11 4.5a5 5 0 0 1 0 7" />
                          </svg>
                        )}
                      </button>
                      {index === messages.length - 1 && messages[index - 1]?.role === 'user' && (
                        <button
                          type="button"
                          className={`ai-regenerate-button${regeneratingIndex === index ? ' is-regenerating' : ''}`}
                          aria-label={translate(language, 'aiRegenerate')}
                          title={translate(language, 'aiRegenerate')}
                          disabled={isSending}
                          onClick={() => regenerateResponse(index)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.5 7a5.5 5.5 0 0 0-9.4-3.9L2.5 4.7M2.5 1.8v2.9h2.9M2.5 9a5.5 5.5 0 0 0 9.4 3.9l1.6-1.6m0 2.9v-2.9h-2.9" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ) : <p>{item.text}</p>}
              </div>
            ))}
            {isSending && (
              <div className="ai-message ai-message-model ai-typing" role="status">
                <FieldnoteMark className="ai-message-mark" />
                <p>
                  {translate(language, 'aiThinking')}
                  <span className="ai-typing-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </p>
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
              {language === 'th' && thaiSpeechVoices.length > 1 ? (
                <label className="ai-voice-choice">
                  <span>{translate(language, 'aiVoice')}</span>
                  <select
                    value={selectedSpeechVoiceURI}
                    aria-label={translate(language, 'aiVoice')}
                    onChange={(event) => setSelectedSpeechVoiceURI(event.target.value)}
                  >
                    <option value="">{translate(language, 'aiVoiceRecommended')}</option>
                    {thaiSpeechVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>
                    ))}
                  </select>
                </label>
              ) : <span>{translate(language, 'aiEnterHint')}</span>}
              <div className="ai-form-actions">
                <button
                  type="button"
                  className={`ai-mic-button${isListening ? ' is-listening' : ''}`}
                  aria-label={translate(language, isListening ? 'aiStopListening' : 'aiDictate')}
                  aria-pressed={isListening}
                  title={translate(language, isListening ? 'aiStopListening' : 'aiDictate')}
                  onClick={toggleListening}
                  disabled={isSending}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="6" y="2" width="4" height="8" rx="2" />
                    <path d="M4 7.5a4 4 0 0 0 8 0M8 11.5v2M6 13.5h4" />
                  </svg>
                </button>
                <button
                  type="submit"
                  className="ai-send-button"
                  disabled={!draft.trim() || isSending}
                  aria-label={translate(language, 'aiSend')}
                >
                  ↑
                </button>
              </div>
            </div>
          </form>
        </section>
      )}
      <button
        type="button"
        className={`ai-launcher ${isOpen ? 'ai-launcher-open' : ''}`}
        aria-expanded={isOpen}
        aria-label={translate(language, isOpen ? 'aiClose' : 'aiOpen')}
        onClick={() => {
          if (isOpen) closeChat()
          else setIsOpen(true)
        }}
      >
        {isOpen ? '×' : <><FieldnoteMark className="ai-launcher-mark" /><span>{translate(language, 'aiOpen')}</span></>}
      </button>
    </div>
  )
}

export default ChatAssistant
