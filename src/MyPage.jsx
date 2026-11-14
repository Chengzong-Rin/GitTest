import AccountSettings from './AccountSettings.jsx'
import { translate, translateCategory } from './translations.js'
import './MyPage.css'

const examTracks = [
  { id: 'itPassport', nameKey: 'itPassport' },
  { id: 'fe', nameKey: 'feExam' },
]

const dateFormatters = {
  ja: new Intl.DateTimeFormat('ja-JP'),
  en: new Intl.DateTimeFormat('en-US'),
  th: new Intl.DateTimeFormat('th-TH'),
}

function MyPage({
  user,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  history,
  bookmarkedQuestions,
  onToggleBookmark,
  onUserUpdate,
  onAccountDeleted,
  onBack,
  onStartExam,
}) {
  const percentages = history.map((attempt) => Math.round((attempt.correct / attempt.total) * 100))
  const average = percentages.length
    ? Math.round(percentages.reduce((total, score) => total + score, 0) / percentages.length)
    : null
  const best = percentages.length ? Math.max(...percentages) : null
  const initials = (user.displayName?.trim() || user.email).slice(0, 1).toUpperCase()
  const topicTotals = {}
  for (const attempt of history) {
    for (const [category, score] of Object.entries(attempt.categoryResults ?? {})) {
      topicTotals[category] ??= { correct: 0, total: 0 }
      topicTotals[category].correct += score.correct
      topicTotals[category].total += score.total
    }
  }
  const weakTopics = Object.entries(topicTotals)
    .map(([category, score]) => ({ category, ...score, accuracy: Math.round((score.correct / score.total) * 100) }))
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 3)

  return (
    <main className="my-page-main" lang={language}>
      <button className="back-button my-page-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {translate(language, 'navExams')}
      </button>

      <section className="my-page-profile" aria-labelledby="my-page-title">
        <div className="profile-avatar" aria-hidden="true">
          {user.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : initials}
        </div>
        <div className="profile-copy">
          <span className="eyebrow">{translate(language, 'myPageEyebrow')}</span>
          <h1 id="my-page-title">{user.displayName || translate(language, 'myPageHeading')}</h1>
          <p>{translate(language, 'myPageIntro')}</p>
        </div>
        <div className="profile-status">
          <span className="status-indicator" aria-hidden="true" />
          <span>{translate(language, 'activeAccount')}</span>
        </div>
      </section>

      <section className="my-page-identity" aria-label={translate(language, 'profileEmail')}>
        <span>{translate(language, 'profileEmail')}</span>
        <div className="identity-email">
          <strong>{user.email}</strong>
          <span>{translate(language, 'emailUnverified')}</span>
        </div>
      </section>

      <section className="my-page-stats" aria-labelledby="study-overview-title">
        <div className="my-page-section-heading">
          <h2 id="study-overview-title">{translate(language, 'studyOverview')}</h2>
          <span>{translate(language, 'savedInBrowser')}</span>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <span>{translate(language, 'totalAttempts')}</span>
            <strong>{history.length}</strong>
          </div>
          <div className="stat-item">
            <span>{translate(language, 'averageScore')}</span>
            <strong>{average === null ? '—' : `${average}%`}</strong>
          </div>
          <div className="stat-item">
            <span>{translate(language, 'bestScore')}</span>
            <strong>{best === null ? '—' : `${best}%`}</strong>
          </div>
        </div>
      </section>

      <div className="my-page-content-grid">
        <section className="my-page-history" aria-labelledby="my-history-title">
          <div className="my-page-section-heading">
            <h2 id="my-history-title">{translate(language, 'recentActivity')}</h2>
            <span>{history.length}</span>
          </div>
          {history.length ? (
            <div className="my-history-list">
              <div className="my-history-row my-history-header">
                <span>{translate(language, 'historyDate')}</span>
                <span>{translate(language, 'historyExam')}</span>
                <span>{translate(language, 'historyScore')}</span>
              </div>
              {history.slice(0, 8).map((attempt) => {
                const exam = examTracks.find((track) => track.id === attempt.examId)
                const date = attempt.finishedOn?.[language]
                  ?? dateFormatters[language].format(Date.parse(attempt.finishedAt))
                return (
                  <div className="my-history-row" key={attempt.finishedAt}>
                    <span>{date}</span>
                    <strong>{translate(language, exam?.nameKey ?? 'historyExam')}</strong>
                    <span className="my-history-score">{attempt.correct}<small> / {attempt.total}</small></span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="my-page-empty">
              <p>{translate(language, 'noStats')}</p>
              <span>{translate(language, 'noStatsIntro')}</span>
              <button className="start-button" type="button" onClick={onBack}>
                {translate(language, 'myPageEmptyAction')} <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </section>

        <aside className="my-page-sidebar">
          <section className="exam-progress" aria-labelledby="exam-progress-title">
            <div className="my-page-section-heading">
              <h2 id="exam-progress-title">{translate(language, 'examProgress')}</h2>
            </div>
            {examTracks.map((exam) => {
              const attempts = history.filter((attempt) => attempt.examId === exam.id)
              const bestScore = attempts.length
                ? Math.max(...attempts.map((attempt) => Math.round((attempt.correct / attempt.total) * 100)))
                : null
              return (
                <div className="exam-progress-item" key={exam.id}>
                  <div className="progress-item-heading">
                    <strong>{translate(language, exam.nameKey)}</strong>
                    <span>{bestScore === null ? translate(language, 'notStarted') : `${bestScore}%`}</span>
                  </div>
                  <span className="progress-attempts">{translate(language, 'attemptCount', { count: attempts.length })}</span>
                  <button type="button" onClick={() => onStartExam(exam.id)}>
                    {translate(language, 'startThisExam')} <span aria-hidden="true">↗</span>
                  </button>
                </div>
              )
            })}
          </section>
        </aside>
      </div>

      <div className="my-page-content-grid study-tools-grid">
        <section className="weak-topics-section" aria-labelledby="weak-topics-title">
          <div className="my-page-section-heading">
            <h2 id="weak-topics-title">{translate(language, 'weakTopics')}</h2>
          </div>
          <p className="study-section-intro">{translate(language, 'weakTopicIntro')}</p>
          {weakTopics.length ? (
            <div className="weak-topic-list">
              {weakTopics.map((topic) => (
                <div className="weak-topic-row" key={topic.category}>
                  <div className="weak-topic-heading">
                    <strong>{translateCategory(language, topic.category)}</strong>
                    <span>{topic.accuracy}%</span>
                  </div>
                  <div className="topic-accuracy-track"><span style={{ width: `${topic.accuracy}%` }} /></div>
                  <span className="weak-topic-detail">{translate(language, 'correctOf', topic)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="study-empty-note">{translate(language, 'noWeakTopics')}</p>
          )}
        </section>

        <section className="saved-questions-section" aria-labelledby="saved-questions-title">
          <div className="my-page-section-heading">
            <h2 id="saved-questions-title">{translate(language, 'savedQuestions')}</h2>
            <span>{bookmarkedQuestions.length}</span>
          </div>
          <p className="study-section-intro">{translate(language, 'savedQuestionsIntro')}</p>
          {bookmarkedQuestions.length ? (
            <div className="saved-question-list">
              {bookmarkedQuestions.map((question) => (
                <article className="saved-question-row" key={question.id}>
                  <span className="saved-question-category">{translateCategory(language, question.category)}</span>
                  <p>{question.prompt}</p>
                  <button type="button" onClick={() => onToggleBookmark(question.id)}>
                    {translate(language, 'removeBookmark')}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="study-empty-note">{translate(language, 'emptySavedQuestions')}</p>
          )}
        </section>
      </div>

      <AccountSettings
        user={user}
        language={language}
        onLanguageChange={onLanguageChange}
        theme={theme}
        onThemeChange={onThemeChange}
        history={history}
        bookmarks={bookmarkedQuestions}
        onUserUpdate={onUserUpdate}
        onAccountDeleted={onAccountDeleted}
      />
    </main>
  )
}

export default MyPage
