import { useEffect, useEffectEvent, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { examQuestionSets } from './mockQuestions.js'
import { localizeQuestion } from './questionTranslations.js'
import { translate, translateCategory } from './translations.js'
import './MockExam.css'

const examTracks = [
  {
    id: 'itPassport',
    number: '01',
    name: 'ITパスポート',
    englishName: 'IT PASSPORT',
    description: '経営・管理・テクノロジの基礎を横断して確認します。',
    categories: ['ストラテジ', 'マネジメント', 'テクノロジ'],
    accent: 'teal',
  },
  {
    id: 'fe',
    number: '02',
    name: '基本情報技術者',
    englishName: 'FE / FUNDAMENTALS',
    description: 'アルゴリズム、理論、ネットワークなどの理解を試します。',
    categories: ['基礎理論', 'アルゴリズム', 'ネットワーク', 'DB・セキュリティ'],
    accent: 'coral',
  },
]

const durationSeconds = 15 * 60
const emptyQuestions = []
const historyDateFormatters = {
  ja: new Intl.DateTimeFormat('ja-JP'),
  en: new Intl.DateTimeFormat('en-US'),
  th: new Intl.DateTimeFormat('th-TH'),
}

function readHistory(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

function getScore(questions, answers) {
  return questions.reduce(
    (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
    0,
  )
}

function getCompletionTime() {
  const timestamp = Date.now()
  return {
    finishedAt: new Date(timestamp).toISOString(),
    finishedOn: Object.fromEntries(
      Object.entries(historyDateFormatters).map(([locale, formatter]) => [locale, formatter.format(timestamp)]),
    ),
  }
}

function MockExam({ user, language, onLanguageChange, onSignOut }) {
  const storageKey = `fieldnote-mock-history:${user.id}`
  const [view, setView] = useState('dashboard')
  const [examId, setExamId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => readHistory(storageKey))

  const currentExam = examTracks.find((exam) => exam.id === examId)
  const sourceQuestions = examId ? examQuestionSets[examId] : emptyQuestions
  const questions = sourceQuestions.map((question) => localizeQuestion(question, language))
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  function startExam(nextExamId) {
    setExamId(nextExamId)
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setTimeLeft(durationSeconds)
    setView('test')
  }

  function finishExam() {
    if (!currentExam || !questions.length) return

    const finishedResult = {
      examId,
      correct: getScore(questions, answers),
      total: questions.length,
      ...getCompletionTime(),
    }
    const nextHistory = [finishedResult, ...history].slice(0, 8)
    localStorage.setItem(storageKey, JSON.stringify(nextHistory))
    setHistory(nextHistory)
    setResult(finishedResult)
    setView('results')
  }

  const tickTimer = useEffectEvent(() => {
    if (timeLeft <= 1) {
      setTimeLeft(0)
      finishExam()
      return
    }
    setTimeLeft(timeLeft - 1)
  })

  useEffect(() => {
    if (view !== 'test') return undefined

    const timerId = window.setInterval(() => tickTimer(), 1000)

    return () => window.clearInterval(timerId)
  }, [view])

  function returnToDashboard() {
    setView('dashboard')
    setExamId(null)
    setResult(null)
  }

  function getTrackName(exam) {
    return translate(language, exam.id === 'itPassport' ? 'itPassport' : 'feExam')
  }

  function getTrackDescription(exam) {
    return translate(language, exam.id === 'itPassport' ? 'itPassportDescription' : 'feDescription')
  }

  return (
    <div className="exam-app" lang={language}>
      <header className="exam-topbar">
        <a className="exam-brand" href="#home" onClick={(event) => { event.preventDefault(); returnToDashboard() }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>fieldnote</span>
          <span className="brand-divider" />
          <span className="brand-section">{translate(language, 'brandSection')}</span>
        </a>
        <div className="topbar-account">
          <span className="account-email">{user.email}</span>
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <button className="signout-button" type="button" onClick={onSignOut}>{translate(language, 'logOut')}</button>
        </div>
      </header>

      {view === 'dashboard' && (
        <main className="exam-main">
          <div className="exam-heading-row">
            <div>
              <span className="eyebrow">{translate(language, 'dashboardEyebrow')}</span>
              <h1>{translate(language, 'dashboardLead')} <em>{translate(language, 'dashboardAccent')}</em></h1>
              <p className="dashboard-intro">{translate(language, 'dashboardIntro')}</p>
            </div>
            <div className="session-stamp">
              <span className="stamp-number">{history.length.toString().padStart(2, '0')}</span>
              <span>{translate(language, 'completedExams')}</span>
            </div>
          </div>

          <div className="section-heading">
            <h2>{translate(language, 'chooseExam')}</h2>
            <span>{translate(language, 'examDetails')}</span>
          </div>

          <section className="track-grid" aria-label={translate(language, 'chooseExam')}>
            {examTracks.map((exam) => {
              const attempts = history.filter((attempt) => attempt.examId === exam.id)
              const bestScore = attempts.length
                ? Math.max(...attempts.map((attempt) => Math.round((attempt.correct / attempt.total) * 100)))
                : null

              return (
                <article className={`track-card ${exam.accent}`} key={exam.id}>
                  <div className="track-card-top">
                    <span className="track-number">{exam.number}</span>
                    <span className="track-english">{exam.englishName}</span>
                  </div>
                  <h3>{getTrackName(exam)}</h3>
                  <p>{getTrackDescription(exam)}</p>
                  <ul className="topic-list">
                    {exam.categories.map((category) => <li key={category}>{translateCategory(language, category)}</li>)}
                  </ul>
                  <div className="track-card-bottom">
                    <span>{bestScore === null ? translate(language, 'noAttempts') : translate(language, 'bestAttempts', { score: bestScore, count: attempts.length })}</span>
                    <button className="start-button" type="button" onClick={() => startExam(exam.id)}>
                      {translate(language, 'startExam')} <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="history-section" aria-labelledby="history-title">
            <div className="section-heading">
              <h2 id="history-title">{translate(language, 'recentHistory')}</h2>
              <span>{translate(language, 'savedInBrowser')}</span>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.slice(0, 4).map((attempt) => {
                  const exam = examTracks.find((track) => track.id === attempt.examId)
                  return (
                    <div className="history-row" key={attempt.finishedAt}>
                      <span className="history-exam">{exam ? getTrackName(exam) : ''}</span>
                      <span>{historyDateFormatters[language].format(Date.parse(attempt.finishedAt))}</span>
                      <span className="history-score">{attempt.correct} / {attempt.total}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="empty-history">{translate(language, 'historyEmpty')}</p>
            )}
          </section>

          <p className="source-note">{translate(language, 'sourceNote')}</p>
        </main>
      )}

      {view === 'test' && currentExam && currentQuestion && (
        <main className="test-main">
          <div className="test-topline">
            <button className="back-button" type="button" onClick={returnToDashboard}>← {translate(language, 'examList')}</button>
            <span className="test-title">{getTrackName(currentExam)} <span>/ {translate(language, 'miniMock')}</span></span>
            <div className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`} aria-live="polite">
              <span className="timer-label">{translate(language, 'timeRemaining')}</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          <div className="test-progress-row">
            <span>{translate(language, 'answeredCount')} <strong>{answeredCount}</strong> / {questions.length}</span>
            <div className="progress-track" role="progressbar" aria-label={translate(language, 'questionList')} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
              <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>

          <div className="test-layout">
            <aside className="question-sidebar">
              <span className="sidebar-label">{translate(language, 'questionList')}</span>
              <div className="question-index-grid">
                {questions.map((question, index) => (
                  <button
                    className={`question-index ${currentIndex === index ? 'current' : ''} ${answers[question.id] !== undefined ? 'answered' : ''}`}
                    key={question.id}
                    type="button"
                    aria-label={translate(language, 'questionAria', {
                      number: index + 1,
                      answered: answers[question.id] !== undefined ? translate(language, 'questionAnsweredSuffix') : '',
                    })}
                    aria-current={currentIndex === index ? 'step' : undefined}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
              <div className="sidebar-legend"><span /> {translate(language, 'answered')}</div>
              <button className="finish-button" type="button" onClick={finishExam}>{translate(language, 'finishAndScore')}</button>
            </aside>

            <section className="question-panel" aria-labelledby="question-title">
              <div className="question-meta">
                <span>{translate(language, 'questionLabel')} {String(currentIndex + 1).padStart(2, '0')}</span>
                <span className="category-label">{translateCategory(language, currentQuestion.category)}</span>
              </div>
              <h1 id="question-title">{currentQuestion.prompt}</h1>
              <p className="answer-instruction">{translate(language, 'chooseOne')}</p>

              <div className="answer-list" role="radiogroup" aria-label={translate(language, 'answerOptions')}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index
                  return (
                    <button
                      className={`answer-option ${isSelected ? 'selected' : ''}`}
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: index }))}
                    >
                      <span className="option-letter">{translate(language, 'optionLetters')[index]}</span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              <div className="question-controls">
                <button className="previous-button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>
                  {translate(language, 'previousQuestion')}
                </button>
                <button className="next-button" type="button" onClick={() => currentIndex === questions.length - 1 ? finishExam() : setCurrentIndex((index) => index + 1)}>
                  {currentIndex === questions.length - 1 ? translate(language, 'finishAndScore') : translate(language, 'nextQuestion')} <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {view === 'results' && currentExam && result && (
        <main className="results-main">
          <button className="back-button" type="button" onClick={returnToDashboard}>← {translate(language, 'examList')}</button>
          <section className="result-summary">
            <span className="eyebrow">{translate(language, 'resultLabel')} / {getTrackName(currentExam)}</span>
            <h1>{result.correct}<span> / {result.total}</span></h1>
            <p>{translate(language, result.correct >= 7 ? 'resultGood' : 'resultRetry')}</p>
            <div className="result-actions">
              <button className="next-button" type="button" onClick={() => startExam(examId)}>{translate(language, 'retryExam')} <span aria-hidden="true">↻</span></button>
              <button className="previous-button" type="button" onClick={returnToDashboard}>{translate(language, 'backToExams')}</button>
            </div>
          </section>

          <section className="review-section" aria-labelledby="review-title">
            <div className="section-heading">
              <h2 id="review-title">{translate(language, 'reviewTitle')}</h2>
              <span>{translate(language, 'correctAnswer')} {result.correct} / {result.total}</span>
            </div>
            <div className="review-list">
              {questions.map((question, index) => {
                const selected = answers[question.id]
                const isCorrect = selected === question.answer
                return (
                  <article className={`review-item ${isCorrect ? 'review-correct' : 'review-incorrect'}`} key={question.id}>
                    <div className="review-heading">
                      <span>Q{String(index + 1).padStart(2, '0')} · {translateCategory(language, question.category)}</span>
                      <strong>{translate(language, isCorrect ? 'reviewCorrect' : 'reviewNeedsReview')}</strong>
                    </div>
                    <h3>{question.prompt}</h3>
                    <p className="review-answer">{translate(language, 'yourAnswer')}：{selected === undefined ? translate(language, 'unanswered') : question.options[selected]}</p>
                    <p className="review-answer">{translate(language, 'correctAnswer')}：{question.options[question.answer]}</p>
                    <p className="review-explanation">{question.explanation}</p>
                  </article>
                )
              })}
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default MockExam