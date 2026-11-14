import { useEffect, useEffectEvent, useState } from 'react'
import MyPage from './MyPage.jsx'
import { examQuestionSets } from './mockQuestions.js'
import { localizeQuestion } from './questionTranslations.js'
import { translate, translateCategory } from './translations.js'
import ChatAssistant from './ChatAssistant.jsx'
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
const practiceYearOptions = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
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

function readBookmarks(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    return []
  }
}

function readPracticeMisses(storageKey) {
  try {
    const savedMisses = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return {
      itPassport: Array.isArray(savedMisses.itPassport) ? savedMisses.itPassport : [],
      fe: Array.isArray(savedMisses.fe) ? savedMisses.fe : [],
    }
  } catch {
    return { itPassport: [], fe: [] }
  }
}

function readResolvedReviewQuestions(storageKey) {
  try {
    const savedQuestions = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return {
      itPassport: Array.isArray(savedQuestions.itPassport) ? savedQuestions.itPassport : [],
      fe: Array.isArray(savedQuestions.fe) ? savedQuestions.fe : [],
    }
  } catch {
    return { itPassport: [], fe: [] }
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

function shuffleQuestions(questions) {
  const shuffled = [...questions]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
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

function MockExam({ user, language, onLanguageChange, theme, onThemeChange, onUserUpdate, onAccountDeleted, onSignOut }) {
  const storageKey = `fieldnote-mock-history:${user.id}`
  const bookmarkStorageKey = `fieldnote-mock-bookmarks:${user.id}`
  const practiceMissesStorageKey = `fieldnote-practice-misses:${user.id}`
  const resolvedReviewStorageKey = `fieldnote-resolved-review:${user.id}`
  const [view, setView] = useState('dashboard')
  const [viewBeforeMyPage, setViewBeforeMyPage] = useState('dashboard')
  const [examId, setExamId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [practiceQuestions, setPracticeQuestions] = useState([])
  const [practiceMode, setPracticeMode] = useState('')
  const [practiceScore, setPracticeScore] = useState(null)
  const [customCounts, setCustomCounts] = useState({ itPassport: 10, fe: 10 })
  const [customYearRanges, setCustomYearRanges] = useState({
    itPassport: { from: practiceYearOptions[0], to: practiceYearOptions.at(-1) },
    fe: { from: practiceYearOptions[0], to: practiceYearOptions.at(-1) },
  })
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => readHistory(storageKey))
  const [practiceMisses, setPracticeMisses] = useState(() => readPracticeMisses(practiceMissesStorageKey))
  const [resolvedReviewQuestions, setResolvedReviewQuestions] = useState(() => readResolvedReviewQuestions(resolvedReviewStorageKey))
  const [bookmarkedIds, setBookmarkedIds] = useState(() => readBookmarks(bookmarkStorageKey))

  const currentExam = examTracks.find((exam) => exam.id === examId)
  const isPractice = view === 'practice'
  const sourceQuestions = isPractice
    ? practiceQuestions
    : examId ? examQuestionSets[examId].slice(0, 10) : emptyQuestions
  const questions = sourceQuestions.map((question) => localizeQuestion(question, language))
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const bookmarkedQuestions = Object.values(examQuestionSets)
    .flat()
    .filter((question) => bookmarkedIds.includes(question.id))
    .map((question) => localizeQuestion(question, language))

  function startExam(nextExamId) {
    setError('')
    setExamId(nextExamId)
    setPracticeQuestions([])
    setPracticeMode('')
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setTimeLeft(durationSeconds)
    setView('test')
  }

  function startPractice(nextQuestions, mode) {
    if (!nextQuestions.length) return
    setError('')
    setExamId(null)
    setPracticeQuestions(nextQuestions)
    setPracticeMode(mode)
    setPracticeScore(null)
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setView('practice')
  }

  function startDailyQuest() {
    const allQuestions = Object.values(examQuestionSets).flat()
    startPractice(shuffleQuestions(allQuestions).slice(0, 10), 'dailyQuest')
  }

  function getMissedQuestions(nextExamId) {
    const mockMissedIds = history
      .filter((attempt) => attempt.examId === nextExamId)
      .flatMap((attempt) => Array.isArray(attempt.incorrectQuestionIds) ? attempt.incorrectQuestionIds : [])
    const missedIds = new Set([
      ...mockMissedIds,
      ...practiceMisses[nextExamId],
    ])
    const resolvedIds = new Set(resolvedReviewQuestions[nextExamId])
    return examQuestionSets[nextExamId].filter((question) => missedIds.has(question.id) && !resolvedIds.has(question.id))
  }

  function saveResolvedReviewQuestions(nextResolvedQuestions) {
    try {
      localStorage.setItem(resolvedReviewStorageKey, JSON.stringify(nextResolvedQuestions))
      setResolvedReviewQuestions(nextResolvedQuestions)
      setError('')
      return true
    } catch {
      setError(translate(language, 'practiceMissSaveError'))
      return false
    }
  }

  function selectPracticeAnswer(question, answerIndex) {
    if (answers[question.id] !== undefined) return
    setAnswers((previous) => ({ ...previous, [question.id]: answerIndex }))

    if (!practiceMode.startsWith('review-') || answerIndex !== question.answer) return
    const examIdForReview = practiceMode.slice('review-'.length)
    if (resolvedReviewQuestions[examIdForReview].includes(question.id)) return

    saveResolvedReviewQuestions({
      ...resolvedReviewQuestions,
      [examIdForReview]: [...resolvedReviewQuestions[examIdForReview], question.id],
    })
  }

  function startReview(nextExamId) {
    startPractice(getMissedQuestions(nextExamId), `review-${nextExamId}`)
  }

  function startCustomPractice(nextExamId) {
    const availableQuestions = getCustomQuestions(nextExamId)
    if (!availableQuestions.length) return
    const count = Math.max(1, Math.min(
      availableQuestions.length,
      Number(customCounts[nextExamId]) || 1,
    ))
    startPractice(shuffleQuestions(availableQuestions).slice(0, count), `custom-${nextExamId}`)
  }

  function getCustomQuestions(nextExamId) {
    const { from, to } = customYearRanges[nextExamId]
    return examQuestionSets[nextExamId].filter(
      (question) => question.practiceYear >= from && question.practiceYear <= to,
    )
  }

  function finishPractice() {
    const score = getScore(sourceQuestions, answers)
    if (practiceMode === 'dailyQuest' || practiceMode.startsWith('custom-')) {
      const missedByExam = { itPassport: [], fe: [] }
      for (const question of sourceQuestions) {
        if (answers[question.id] === undefined || answers[question.id] === question.answer) continue
        const exam = Object.entries(examQuestionSets)
          .find(([, examQuestions]) => examQuestions.some((item) => item.id === question.id))
        if (exam) missedByExam[exam[0]].push(question.id)
      }

      const nextPracticeMisses = {
        itPassport: [...new Set([...practiceMisses.itPassport, ...missedByExam.itPassport])],
        fe: [...new Set([...practiceMisses.fe, ...missedByExam.fe])],
      }
      const nextResolvedReviewQuestions = {
        itPassport: resolvedReviewQuestions.itPassport.filter((id) => !missedByExam.itPassport.includes(id)),
        fe: resolvedReviewQuestions.fe.filter((id) => !missedByExam.fe.includes(id)),
      }
      try {
        localStorage.setItem(practiceMissesStorageKey, JSON.stringify(nextPracticeMisses))
      } catch {
        setError(translate(language, 'practiceMissSaveError'))
        return
      }
      setPracticeMisses(nextPracticeMisses)
      if (!saveResolvedReviewQuestions(nextResolvedReviewQuestions)) return
    }

    setPracticeScore(score)
    setView('practiceResults')
  }

  function toggleBookmark(questionId) {
    setBookmarkedIds((previous) => {
      const next = previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
      try {
        localStorage.setItem(bookmarkStorageKey, JSON.stringify(next))
      } catch {
        return previous
      }
      return next
    })
  }

  function finishExam() {
    if (!currentExam || !questions.length) return

    const categoryResults = {}
    for (const question of sourceQuestions) {
      const category = question.category
      categoryResults[category] ??= { correct: 0, total: 0 }
      categoryResults[category].total += 1
      if (answers[question.id] === question.answer) categoryResults[category].correct += 1
    }
    const finishedResult = {
      examId,
      correct: getScore(questions, answers),
      total: questions.length,
      incorrectQuestionIds: sourceQuestions
        .filter((question) => answers[question.id] !== undefined && answers[question.id] !== question.answer)
        .map((question) => question.id),
      categoryResults,
      ...getCompletionTime(),
    }
    const nextHistory = [finishedResult, ...history].slice(0, 8)
    localStorage.setItem(storageKey, JSON.stringify(nextHistory))
    setHistory(nextHistory)
    const missedByExam = { itPassport: [], fe: [] }
    for (const questionId of finishedResult.incorrectQuestionIds) {
      const questionExam = Object.entries(examQuestionSets)
        .find(([, examQuestions]) => examQuestions.some((question) => question.id === questionId))
      if (questionExam) missedByExam[questionExam[0]].push(questionId)
    }
    if (missedByExam.itPassport.length || missedByExam.fe.length) {
      saveResolvedReviewQuestions({
        itPassport: resolvedReviewQuestions.itPassport.filter((id) => !missedByExam.itPassport.includes(id)),
        fe: resolvedReviewQuestions.fe.filter((id) => !missedByExam.fe.includes(id)),
      })
    }
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
    setPracticeQuestions([])
    setPracticeMode('')
    setPracticeScore(null)
    setResult(null)
  }

  function openMyPage() {
    setViewBeforeMyPage(view)
    setView('mypage')
  }

  function returnFromMyPage() {
    setView(viewBeforeMyPage)
  }

  function getTrackName(exam) {
    return translate(language, exam.id === 'itPassport' ? 'itPassport' : 'feExam')
  }

  function getTrackDescription(exam) {
    return translate(language, exam.id === 'itPassport' ? 'itPassportDescription' : 'feDescription')
  }

  return (
    <div className="exam-app" lang={language} data-theme={theme}>
      <header className="exam-topbar">
        <a className="exam-brand" href="#home" onClick={(event) => { event.preventDefault(); returnToDashboard() }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>fieldnote</span>
          <span className="brand-divider" />
          <span className="brand-section">{translate(language, 'brandSection')}</span>
        </a>
        <div className="topbar-account">
          <span className="account-email">{user.displayName || user.email}</span>
          {view === 'mypage' ? (
            <button className="my-page-nav" type="button" onClick={returnFromMyPage}>
              {translate(language, 'navExams')}
            </button>
          ) : (
            <button className="my-page-nav" type="button" onClick={openMyPage}>
              {translate(language, 'navMyPage')}
            </button>
          )}
          <button className="signout-button" type="button" onClick={onSignOut}>{translate(language, 'logOut')}</button>
        </div>
      </header>

      {error && <p className="form-status" role="alert">{error}</p>}

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

          <section className="practice-modes-section" aria-labelledby="practice-modes-title">
            <div className="section-heading">
              <h2 id="practice-modes-title">{translate(language, 'practiceModes')}</h2>
              <span>{translate(language, 'instantFeedback')}</span>
            </div>
            <div className="practice-mode-grid">
              <article className="practice-mode-card daily-mode-card">
                <span className="practice-mode-kicker">01 / DAILY</span>
                <h3>{translate(language, 'dailyQuest')}</h3>
                <p>{translate(language, 'dailyQuestDescription')}</p>
                <button className="start-button" type="button" onClick={startDailyQuest}>
                  {translate(language, 'startPractice')} <span aria-hidden="true">↗</span>
                </button>
              </article>

              {examTracks.map((exam, index) => {
                const missedCount = getMissedQuestions(exam.id).length
                return (
                  <article className={`practice-mode-card ${exam.accent}`} key={`review-${exam.id}`}>
                    <span className="practice-mode-kicker">{String(index + 2).padStart(2, '0')} / REVIEW</span>
                    <h3>{translate(language, 'reviewMode')} · {getTrackName(exam)}</h3>
                    <p>{translate(language, 'wrongQuestionsCount', { count: missedCount })}</p>
                    <button
                      className="start-button"
                      type="button"
                      disabled={missedCount === 0}
                      onClick={() => startReview(exam.id)}
                    >
                      {translate(language, 'startPractice')} <span aria-hidden="true">↗</span>
                    </button>
                  </article>
                )
              })}

              {examTracks.map((exam, index) => {
                const customQuestions = getCustomQuestions(exam.id)
                const selectedCount = customCounts[exam.id] === ''
                  ? ''
                  : Math.min(Number(customCounts[exam.id]) || 1, customQuestions.length)
                const yearRange = customYearRanges[exam.id]
                return (
                  <article className={`practice-mode-card ${exam.accent}`} key={`custom-${exam.id}`}>
                    <span className="practice-mode-kicker">{String(index + 4).padStart(2, '0')} / CUSTOM</span>
                    <h3>{translate(language, 'customMode')} · {getTrackName(exam)}</h3>
                    <p>{translate(language, 'customModeDescription')}</p>
                    <div className="custom-year-range">
                      <span>{translate(language, 'practiceYearRange')}</span>
                      <div className="custom-year-inputs">
                        <label>
                          <span>{translate(language, 'fromYear')}</span>
                          <select
                            value={yearRange.from}
                            aria-label={translate(language, 'fromYearFor', { exam: getTrackName(exam) })}
                            onChange={(event) => {
                              const from = Number(event.target.value)
                              setCustomYearRanges((previous) => ({
                                ...previous,
                                [exam.id]: { from, to: Math.max(from, previous[exam.id].to) },
                              }))
                            }}
                          >
                            {practiceYearOptions.map((year) => (
                              <option key={year} value={year} disabled={year > yearRange.to}>{year}</option>
                            ))}
                          </select>
                        </label>
                        <span className="year-range-separator">–</span>
                        <label>
                          <span>{translate(language, 'toYear')}</span>
                          <select
                            value={yearRange.to}
                            aria-label={translate(language, 'toYearFor', { exam: getTrackName(exam) })}
                            onChange={(event) => {
                              const to = Number(event.target.value)
                              setCustomYearRanges((previous) => ({
                                ...previous,
                                [exam.id]: { from: Math.min(previous[exam.id].from, to), to },
                              }))
                            }}
                          >
                            {practiceYearOptions.map((year) => (
                              <option key={year} value={year} disabled={year < yearRange.from}>{year}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <label className="custom-count-control">
                      <span>{translate(language, 'questionCount')}</span>
                      <input
                        type="number"
                        min="1"
                        max={customQuestions.length}
                        value={selectedCount}
                        aria-label={translate(language, 'questionCountFor', { exam: getTrackName(exam) })}
                        onChange={(event) => {
                          const value = event.target.value
                          setCustomCounts((previous) => ({
                            ...previous,
                            [exam.id]: value === '' ? '' : Math.min(Number(value), customQuestions.length),
                          }))
                        }}
                      />
                      <span>/ {customQuestions.length}</span>
                    </label>
                    <button
                      className="start-button"
                      type="button"
                      disabled={!customQuestions.length || !Number(customCounts[exam.id])}
                      onClick={() => startCustomPractice(exam.id)}
                    >
                      {translate(language, 'startPractice')} <span aria-hidden="true">↗</span>
                    </button>
                  </article>
                )
              })}
            </div>
            <p className="practice-modes-note">{translate(language, 'reviewHistoryHint')}</p>
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

      {view === 'mypage' && (
        <MyPage
          user={user}
          language={language}
          onLanguageChange={onLanguageChange}
          theme={theme}
          onThemeChange={onThemeChange}
          history={history}
          bookmarkedQuestions={bookmarkedQuestions}
          onToggleBookmark={toggleBookmark}
          onUserUpdate={onUserUpdate}
          onAccountDeleted={onAccountDeleted}
          onBack={returnFromMyPage}
          onStartExam={startExam}
        />
      )}

      {view === 'practice' && currentQuestion && (
        <main className="test-main practice-main">
          <div className="test-topline">
            <button className="back-button" type="button" onClick={returnToDashboard}>← {translate(language, 'examList')}</button>
            <span className="test-title">
              {translate(language, practiceMode === 'dailyQuest' ? 'dailyQuest' : practiceMode.startsWith('review-') ? 'reviewMode' : 'customMode')}
              <span> / {translate(language, 'instantFeedback')}</span>
            </span>
            <span className="practice-session-label">{translate(language, 'practiceModeLabel')}</span>
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
            </aside>

            <section className="question-panel" aria-labelledby="practice-question-title">
              <div className="question-meta">
                <span>{translate(language, 'questionLabel')} {String(currentIndex + 1).padStart(2, '0')}</span>
                <span className="category-label">{translateCategory(language, currentQuestion.category)}</span>
                <button
                  className="bookmark-button"
                  type="button"
                  aria-pressed={bookmarkedIds.includes(currentQuestion.id)}
                  onClick={() => toggleBookmark(currentQuestion.id)}
                >
                  {translate(language, bookmarkedIds.includes(currentQuestion.id) ? 'removeBookmark' : 'bookmarkQuestion')}
                </button>
              </div>
              <h1 id="practice-question-title">{currentQuestion.prompt}</h1>
              <p className="answer-instruction">{translate(language, 'chooseOne')}</p>

              <div className="answer-list" role="radiogroup" aria-label={translate(language, 'answerOptions')}>
                {currentQuestion.options.map((option, index) => {
                  const selectedAnswer = answers[currentQuestion.id]
                  const hasAnswered = selectedAnswer !== undefined
                  const isCorrectOption = hasAnswered && index === currentQuestion.answer
                  const isWrongSelection = hasAnswered && selectedAnswer === index && selectedAnswer !== currentQuestion.answer
                  return (
                    <button
                      className={`answer-option ${selectedAnswer === index ? 'selected' : ''} ${isCorrectOption ? 'practice-correct' : ''} ${isWrongSelection ? 'practice-incorrect' : ''}`}
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selectedAnswer === index}
                      disabled={hasAnswered}
                      onClick={() => selectPracticeAnswer(currentQuestion, index)}
                    >
                      <span className="option-letter">{translate(language, 'optionLetters')[index]}</span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              {answers[currentQuestion.id] !== undefined && (
                <div className={`practice-feedback ${answers[currentQuestion.id] === currentQuestion.answer ? 'feedback-correct' : 'feedback-incorrect'}`} role="status">
                  <strong>{translate(language, answers[currentQuestion.id] === currentQuestion.answer ? 'practiceCorrect' : 'practiceIncorrect')}</strong>
                  <p>{translate(language, 'correctAnswer')}：{currentQuestion.options[currentQuestion.answer]}</p>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}

              <div className="question-controls">
                <button className="previous-button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>
                  {translate(language, 'previousQuestion')}
                </button>
                <button
                  className="next-button"
                  type="button"
                  disabled={answers[currentQuestion.id] === undefined}
                  onClick={() => currentIndex === questions.length - 1 ? finishPractice() : setCurrentIndex((index) => index + 1)}
                >
                  {translate(language, currentIndex === questions.length - 1 ? 'finishPractice' : 'nextQuestion')} <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {view === 'practiceResults' && practiceScore !== null && (
        <main className="results-main">
          <section className="result-summary">
            <span className="eyebrow">{translate(language, 'practiceResult')}</span>
            <h1>{practiceScore}<span> / {practiceQuestions.length}</span></h1>
            <p>{translate(language, 'practiceComplete')}</p>
            <div className="result-actions">
              <button className="next-button" type="button" onClick={returnToDashboard}>{translate(language, 'backToExams')}</button>
            </div>
          </section>
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
                <button
                  className="bookmark-button"
                  type="button"
                  aria-pressed={bookmarkedIds.includes(currentQuestion.id)}
                  onClick={() => toggleBookmark(currentQuestion.id)}
                >
                  {translate(language, bookmarkedIds.includes(currentQuestion.id) ? 'removeBookmark' : 'bookmarkQuestion')}
                </button>
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
      <ChatAssistant language={language} />
    </div>
  )
}

export default MockExam