// FinLens — Education Hub

const LessonModal = ({ topic, currentUser, progress, onComplete, onClose }) => {
  const [step, setStep] = React.useState('intro'); // intro | quiz | results
  const [answers, setAnswers] = React.useState({});
  const [qIdx, setQIdx] = React.useState(0);

  if (!topic) return null;

  const questions = topic.quiz;
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
  const passed = score >= 2;

  const select = (i) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers({ ...answers, [qIdx]: i });
  };
  const next = () => {
    if (qIdx < questions.length - 1) setQIdx(qIdx + 1);
    else setStep('results');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: 28 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="row" style={{ gap: 12 }}>
              <div className="topic-icon" style={{ width: 48, height: 48, background: topic.bg, color: topic.color, fontSize: 22 }}>{topic.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{topic.title}</div>
                <div className="small muted">{topic.lessons} lessons · {topic.length}</div>
              </div>
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
          </div>

          {step === 'intro' && (
            <>
              <div style={{
                aspectRatio: '16 / 9',
                borderRadius: 16,
                background: `linear-gradient(135deg, ${topic.color}, ${topic.color}AA), repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.06) 12px 24px)`,
                display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
                marginBottom: 18,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}>
                  <Icon name="play" size={26} stroke={0} />
                </div>
                <div style={{ position: 'absolute', bottom: 14, left: 16, color: '#fff', fontSize: 12, opacity: 0.8 }}>
                  ▶ YouTube · {topic.title} crash course
                </div>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--neutral-700)', margin: '0 0 18px' }}>{topic.description}</p>

              <div className="card-warm" style={{ padding: 16, borderRadius: 14, marginBottom: 18 }}>
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ fontSize: 24 }}>🎯</div>
                  <div>
                    <div className="bold small">After this lesson you'll be able to:</div>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.55, color: 'var(--neutral-700)' }}>
                      <li>Apply the {topic.title.toLowerCase()} principles to a weekly allowance</li>
                      <li>Spot common pitfalls before they cost you money</li>
                      <li>Earn the <b>{topic.title} Hero</b> badge</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="small muted">3-question quiz at the end</div>
                <button className="btn btn-primary" onClick={() => setStep('quiz')}>Start quiz <Icon name="arrow-right" size={14} stroke={2.4}/></button>
              </div>
            </>
          )}

          {step === 'quiz' && (() => {
            const q = questions[qIdx];
            const selected = answers[qIdx];
            const answered = selected !== undefined;
            return (
              <div>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="small bold">Question {qIdx + 1} of {questions.length}</div>
                  <div className="small muted">Score: {Object.keys(answers).filter(k => answers[k] === questions[k].correct).length} / {questions.length}</div>
                </div>
                <div className="progress" style={{ marginBottom: 22 }}>
                  <div className="progress-fill" style={{ width: ((qIdx + (answered ? 1 : 0)) / questions.length) * 100 + '%' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, lineHeight: 1.4 }}>{q.q}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {q.options.map((opt, i) => {
                    let cls = 'quiz-option';
                    if (answered) {
                      if (i === q.correct) cls += ' correct';
                      else if (i === selected) cls += ' wrong';
                    } else if (selected === i) cls += ' selected';
                    return (
                      <button key={i} className={cls} disabled={answered} onClick={() => select(i)}>
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {answered && i === q.correct && <Icon name="check" size={18} stroke={2.6} />}
                        {answered && i === selected && i !== q.correct && <Icon name="x" size={18} stroke={2.6} />}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
                    <button className="btn btn-primary" onClick={next}>{qIdx < questions.length - 1 ? 'Next question' : 'See results'} <Icon name="arrow-right" size={14} stroke={2.4}/></button>
                  </div>
                )}
              </div>
            );
          })()}

          {step === 'results' && (
            <div style={{ textAlign: 'center', padding: '20px 8px' }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: passed ? 'var(--secondary)' : 'var(--tertiary-warm)',
                display: 'grid', placeItems: 'center', margin: '0 auto 20px',
                fontSize: 48,
              }}>{passed ? '🏆' : '📚'}</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{passed ? `Nice work, ${currentUser.name}!` : 'So close — try again!'}</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 14 }}>
                You got <b>{score} of {questions.length}</b> correct
                {passed && <> · awarded the <b style={{ color: 'var(--primary-900)' }}>{topic.title} Hero</b> badge</>}
              </div>
              <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 22 }}>
                <button className="btn btn-outlined" onClick={onClose}>Close</button>
                {passed
                  ? <button className="btn btn-primary" onClick={() => { onComplete(topic, score); }}><Icon name="check" size={16} stroke={2.4}/> Claim badge</button>
                  : <button className="btn btn-primary" onClick={() => { setStep('quiz'); setQIdx(0); setAnswers({}); }}>Try again</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Education = ({ progress, currentUser, onComplete }) => {
  const [openTopic, setOpenTopic] = React.useState(null);

  const totalXP = currentUser.xp;
  const nextLevel = 3000;
  const userProgress = progress[currentUser.id];

  return (
    <div className="grid grid-12">
      {/* XP Hero */}
      <div className="span-12 card card-dark" style={{ overflow: 'hidden', position: 'relative', padding: '28px 32px' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)' }}/>
        <div style={{ position: 'absolute', right: 60, top: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)' }}/>
        <div className="row" style={{ gap: 20, position: 'relative' }}>
          <Avatar member={currentUser} size="lg" />
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 22 }}>{currentUser.name}'s learning path</span>
              <span className="chip" style={{ background: 'var(--primary)', color: 'var(--neutral-900)' }}>{currentUser.level}</span>
            </div>
            <div className="small" style={{ color: 'rgba(255,255,255,0.65)' }}>{totalXP} XP earned · {nextLevel - totalXP} XP to next level</div>
            <div style={{ marginTop: 12, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (totalXP / nextLevel) * 100 + '%', background: 'linear-gradient(90deg, #25D366, #6CE599)', borderRadius: 999 }}/>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {userProgress.badges.map(b => (
              <div key={b} title={b} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', fontSize: 22 }}>🏆</div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="span-12">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Topics</div>
            <div className="small muted">Tap any card to start a lesson · 3-question quiz at the end</div>
          </div>
          <div className="tab-bar">
            <button className="tab active">All</button>
            <button className="tab">In progress</button>
            <button className="tab">Completed</button>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 18 }}>
          {TOPICS.map(t => {
            const pct = userProgress[t.id] || 0;
            return (
              <div key={t.id} className="topic-card" onClick={() => setOpenTopic(t)} style={{ background: t.bg }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="topic-icon" style={{ background: 'var(--white)', color: t.color, fontSize: 26 }}>{t.icon}</div>
                  {pct === 100 && <span className="chip chip-primary"><Icon name="check" size={12} stroke={3}/> Completed</span>}
                  {pct > 0 && pct < 100 && <span className="chip chip-warm">{pct}% done</span>}
                  {pct === 0 && <span className="chip">New</span>}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{t.title}</div>
                  <div className="small" style={{ color: 'var(--neutral-700)', marginTop: 2 }}>{t.sub}</div>
                </div>
                <div className="row" style={{ gap: 14, fontSize: 12.5, color: 'var(--neutral-700)' }}>
                  <div className="row" style={{ gap: 4 }}><Icon name="book" size={13}/> {t.lessons} lessons</div>
                  <div className="row" style={{ gap: 4 }}><Icon name="clock" size={13}/> {t.length}</div>
                </div>
                <div className="xp-bar"><div className="xp-bar-fill" style={{ width: pct + '%' }}/></div>
                <button className="btn btn-inverted btn-sm" style={{ alignSelf: 'flex-start' }}>
                  {pct === 0 ? 'Start lesson' : pct === 100 ? 'Review' : 'Continue'} <Icon name="arrow-right" size={14} stroke={2.4}/>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Family leaderboard */}
      <div className="span-12 card">
        <div className="card-header">
          <div>
            <div className="card-title">Family leaderboard</div>
            <div className="card-sub">Who's learning the most this month?</div>
          </div>
          <span className="chip chip-primary"><Icon name="flame" size={12}/> 12-day family streak</span>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {[...FAMILY].sort((a, b) => b.xp - a.xp).map((m, i) => (
            <div key={m.id} className="row" style={{ padding: '12px 8px', borderRadius: 12, background: i === 0 ? 'var(--secondary)' : 'transparent' }}>
              <div style={{ width: 28, fontWeight: 700, color: 'var(--neutral-500)' }}>#{i + 1}</div>
              <Avatar member={m} />
              <div style={{ flex: 1 }}>
                <div className="bold" style={{ fontSize: 14 }}>{m.name}</div>
                <div className="small muted">{m.level}</div>
              </div>
              <div style={{ width: 220, marginRight: 16 }}>
                <div className="xp-bar"><div className="xp-bar-fill" style={{ width: (m.xp / 3000) * 100 + '%' }}/></div>
              </div>
              <div className="bold" style={{ width: 80, textAlign: 'right' }}>{m.xp} XP</div>
              <div style={{ width: 90, textAlign: 'right' }}>
                {progress[m.id].badges.map((b, j) => <span key={j} style={{ fontSize: 16 }}>🏆</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LessonModal
        topic={openTopic}
        currentUser={currentUser}
        progress={userProgress}
        onComplete={(t, score) => { onComplete(t, score); setOpenTopic(null); }}
        onClose={() => setOpenTopic(null)}
      />
    </div>
  );
};

Object.assign(window, { Education });
