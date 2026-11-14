import { useEffect, useEffectEvent, useState } from 'react'
import { examQuestionSets } from './mockQuestions.js'
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

function MockExam({ user, onSignOut }) {
  const storageKey = `fieldnote-mock-history:${user.id}`
  const [view, setView] = useState('dashboard')
  const [examId, setExamId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => readHistory(storageKey))

  const currentExam = examTracks.find((exam) => exam.id === examId)
  const questions = examId ? examQuestionSets[examId] : emptyQuestions
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
      finishedAt: new Date().toISOString(),
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

  return (
    <div className="exam-app">
      <header className="exam-topbar">
        <a className="exam-brand" href="#home" onClick={(event) => { event.preventDefault(); returnToDashboard() }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>fieldnote</span>
          <span className="brand-divider" />
          <span className="brand-section">EXAM STUDIO</span>
        </a>
        <div className="topbar-account">
          <span className="account-email">{user.email}</span>
          <button className="signout-button" type="button" onClick={onSignOut}>ログアウト</button>
        </div>
      </header>

      {view === 'dashboard' && (
        <main className="exam-main">
          <div className="exam-heading-row">
            <div>
              <span className="eyebrow">INDEPENDENT PRACTICE / 2026</span>
              <h1>次の一問から、<em>はじめよう。</em></h1>
              <p className="dashboard-intro">出題分野を参考に構成した、オリジナルのミニ模試です。</p>
            </div>
            <div className="session-stamp">
              <span className="stamp-number">{history.length.toString().padStart(2, '0')}</span>
              <span>完了した模試</span>
            </div>
          </div>

          <div className="section-heading">
            <h2>試験を選ぶ</h2>
            <span>各10問 / 制限時間15分</span>
          </div>

          <section className="track-grid" aria-label="模擬試験一覧">
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
                  <h3>{exam.name}</h3>
                  <p>{exam.description}</p>
                  <ul className="topic-list">
                    {exam.categories.map((category) => <li key={category}>{category}</li>)}
                  </ul>
                  <div className="track-card-bottom">
                    <span>{bestScore === null ? '未受験' : `最高 ${bestScore}% · ${attempts.length}回受験`}</span>
                    <button className="start-button" type="button" onClick={() => startExam(exam.id)}>
                      模試をはじめる <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="history-section" aria-labelledby="history-title">
            <div className="section-heading">
              <h2 id="history-title">最近の記録</h2>
              <span>このブラウザーに保存</span>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.slice(0, 4).map((attempt) => {
                  const exam = examTracks.find((track) => track.id === attempt.examId)
                  return (
                    <div className="history-row" key={attempt.finishedAt}>
                      <span className="history-exam">{exam?.name}</span>
                      <span>{new Date(attempt.finishedAt).toLocaleDateString('ja-JP')}</span>
                      <span className="history-score">{attempt.correct} / {attempt.total}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="empty-history">模試を完了すると、ここにスコアが表示されます。</p>
            )}
          </section>

          <p className="source-note">問題は参考教材の出題分野をもとに作成したオリジナル問題です。公式問題ではありません。</p>
        </main>
      )}

      {view === 'test' && currentExam && currentQuestion && (
        <main className="test-main">
          <div className="test-topline">
            <button className="back-button" type="button" onClick={returnToDashboard}>← 試験一覧</button>
            <span className="test-title">{currentExam.name} <span>/ ミニ模試</span></span>
            <div className={`timer ${timeLeft <= 60 ? 'timer-warning' : ''}`} aria-live="polite">
              <span className="timer-label">残り時間</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          <div className="test-progress-row">
            <span>回答済み <strong>{answeredCount}</strong> / {questions.length}</span>
            <div className="progress-track" role="progressbar" aria-label="問題の進行状況" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
              <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>

          <div className="test-layout">
            <aside className="question-sidebar">
              <span className="sidebar-label">問題一覧</span>
              <div className="question-index-grid">
                {questions.map((question, index) => (
                  <button
                    className={`question-index ${currentIndex === index ? 'current' : ''} ${answers[question.id] !== undefined ? 'answered' : ''}`}
                    key={question.id}
                    type="button"
                    aria-label={`問題 ${index + 1}${answers[question.id] !== undefined ? ' 回答済み' : ''}`}
                    aria-current={currentIndex === index ? 'step' : undefined}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
              <div className="sidebar-legend"><span /> 回答済み</div>
              <button className="finish-button" type="button" onClick={finishExam}>採点して終了</button>
            </aside>

            <section className="question-panel" aria-labelledby="question-title">
              <div className="question-meta">
                <span>QUESTION {String(currentIndex + 1).padStart(2, '0')}</span>
                <span className="category-label">{currentQuestion.category}</span>
              </div>
              <h1 id="question-title">{currentQuestion.prompt}</h1>
              <p className="answer-instruction">最も適切なものを1つ選んでください。</p>

              <div className="answer-list" role="radiogroup" aria-label="回答選択肢">
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
                      <span className="option-letter">{['ア', 'イ', 'ウ', 'エ'][index]}</span>
                      <span>{option}</span>
                    </button>
                  )
                })}
              </div>

              <div className="question-controls">
                <button className="previous-button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>
                  前の問題
                </button>
                <button className="next-button" type="button" onClick={() => currentIndex === questions.length - 1 ? finishExam() : setCurrentIndex((index) => index + 1)}>
                  {currentIndex === questions.length - 1 ? '採点して終了' : '次の問題'} <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {view === 'results' && currentExam && result && (
        <main className="results-main">
          <button className="back-button" type="button" onClick={returnToDashboard}>← 試験一覧</button>
          <section className="result-summary">
            <span className="eyebrow">RESULT / {currentExam.englishName}</span>
            <h1>{result.correct}<span> / {result.total}</span></h1>
            <p>{result.correct >= 7 ? 'いい調子です。解説で知識を定着させましょう。' : '解説を確認して、もう一度挑戦してみましょう。'}</p>
            <div className="result-actions">
              <button className="next-button" type="button" onClick={() => startExam(examId)}>もう一度挑戦 <span aria-hidden="true">↻</span></button>
              <button className="previous-button" type="button" onClick={returnToDashboard}>試験一覧へ</button>
            </div>
          </section>

          <section className="review-section" aria-labelledby="review-title">
            <div className="section-heading">
              <h2 id="review-title">問題と解説</h2>
              <span>正解 {result.correct} / {result.total}</span>
            </div>
            <div className="review-list">
              {questions.map((question, index) => {
                const selected = answers[question.id]
                const isCorrect = selected === question.answer
                return (
                  <article className={`review-item ${isCorrect ? 'review-correct' : 'review-incorrect'}`} key={question.id}>
                    <div className="review-heading">
                      <span>Q{String(index + 1).padStart(2, '0')} · {question.category}</span>
                      <strong>{isCorrect ? '正解' : '要復習'}</strong>
                    </div>
                    <h3>{question.prompt}</h3>
                    <p className="review-answer">あなたの回答：{selected === undefined ? '未回答' : question.options[selected]}</p>
                    <p className="review-answer">正解：{question.options[question.answer]}</p>
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