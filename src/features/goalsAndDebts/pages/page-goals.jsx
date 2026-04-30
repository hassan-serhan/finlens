// FinLens — Goals & Debts page

const ContributeModal = ({ goal, onContribute, onClose }) => {
  const [amount, setAmount] = React.useState('50');
  const [from, setFrom] = React.useState('ahmed');
  if (!goal) return null;
  const submit = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num) return;
    onContribute(goal.id, num, from);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 28 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="row">
              <div className="goal-icon" style={{ fontSize: 22 }}>{goal.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Contribute to {goal.name}</div>
                <div className="small muted">{fmt(goal.saved)} of {fmt(goal.target)} saved</div>
              </div>
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
          </div>
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label>Amount</label>
              <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {[25, 50, 100, 250].map(n => (
                <button type="button" key={n} className="chip chip-primary" style={{ cursor: 'pointer' }} onClick={() => setAmount(String(n))}>+{fmt(n)}</button>
              ))}
            </div>
            <div className="field">
              <label>From</label>
              <select value={from} onChange={e => setFrom(e.target.value)}>
                {FAMILY.map(m => <option key={m.id} value={m.id}>{m.name}'s allowance / account</option>)}
              </select>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button type="button" className="btn btn-outlined" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Icon name="check" size={16} stroke={2.4}/> Contribute</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const GoalsAndDebts = ({ goals, debts, onContribute }) => {
  const [contributingTo, setContributingTo] = React.useState(null);
  const [tab, setTab] = React.useState('savings');

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalDebt = debts.reduce((s, d) => s + d.total, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0);

  return (
    <div className="grid grid-12">
      {/* Summary tiles */}
      <div className="span-12 grid grid-3">
        <div className="card card-dark">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>Total saved</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{fmt(totalSaved)}</div>
            </div>
            <div className="goal-icon" style={{ background: 'var(--primary)', color: 'var(--neutral-900)', fontSize: 22 }}>💰</div>
          </div>
          <div className="progress" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="progress-fill" style={{ width: Math.round((totalSaved / totalTarget) * 100) + '%' }} />
          </div>
          <div className="small" style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>
            {Math.round((totalSaved / totalTarget) * 100)}% toward {fmt(totalTarget)} in goals
          </div>
        </div>

        <div className="card card-tint">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="small" style={{ color: 'var(--primary-900)' }}>Debt remaining</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, color: 'var(--neutral-900)' }}>{fmt(totalDebt - totalPaid)}</div>
            </div>
            <div className="goal-icon" style={{ background: 'var(--white)', fontSize: 22 }}>🛡️</div>
          </div>
          <div className="progress" style={{ background: 'rgba(14, 92, 44, 0.15)' }}>
            <div className="progress-fill" style={{ width: Math.round((totalPaid / totalDebt) * 100) + '%' }} />
          </div>
          <div className="small" style={{ color: 'var(--primary-900)', marginTop: 8, fontWeight: 600 }}>
            {Math.round((totalPaid / totalDebt) * 100)}% paid off · on track for Mar 2027
          </div>
        </div>

        <div className="card card-warm">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="small muted">This month's contributions</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{fmt(840)}</div>
            </div>
            <div className="goal-icon" style={{ background: 'var(--white)', fontSize: 22 }}>📈</div>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            {FAMILY.map(m => <Avatar key={m.id} member={m} size="sm" />)}
            <div className="small muted" style={{ marginLeft: 6 }}>everyone chipped in</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="span-12">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="tab-bar">
            <button className={'tab ' + (tab === 'savings' ? 'active' : '')} onClick={() => setTab('savings')}>Savings goals · {goals.length}</button>
            <button className={'tab ' + (tab === 'debts' ? 'active' : '')} onClick={() => setTab('debts')}>Debts · {debts.length}</button>
          </div>
          <button className="btn btn-inverted btn-sm"><Icon name="plus" size={14} stroke={2.4}/> New {tab === 'savings' ? 'goal' : 'debt'}</button>
        </div>
      </div>

      {/* Cards */}
      {tab === 'savings' ? (
        <div className="span-12 grid grid-2">
          {goals.map((g, i) => {
            const pct = Math.round((g.saved / g.target) * 100);
            const remaining = g.target - g.saved;
            const featured = i === 0;
            return (
              <div key={g.id} className={'card' + (featured ? ' card-dark' : '')} style={{ position: 'relative' }}>
                {featured && <span className="floating-badge">Top priority</span>}
                <div className="row" style={{ gap: 14, marginBottom: 16 }}>
                  <div className="goal-icon" style={{ width: 56, height: 56, fontSize: 26, background: featured ? 'var(--primary)' : 'var(--secondary)' }}>{g.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{g.name}</div>
                    <div className="small" style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--neutral-500)', marginTop: 2 }}>
                      <Icon name="calendar" size={12}/> Target: {g.due}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {fmt(g.saved)} <span style={{ fontWeight: 500, color: featured ? 'rgba(255,255,255,0.5)' : 'var(--neutral-400)', fontSize: 16 }}>of {fmt(g.target)}</span>
                </div>
                <div className="progress" style={{ background: featured ? 'rgba(255,255,255,0.1)' : undefined }}>
                  <div className="progress-fill" style={{ width: pct + '%' }} />
                </div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
                  <div>
                    <div className="small" style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--neutral-500)' }}>Remaining</div>
                    <div className="bold">{fmt(remaining)}</div>
                  </div>
                  <div>
                    <div className="small" style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--neutral-500)' }}>Monthly pace</div>
                    <div className="bold">{fmt(Math.ceil(remaining / 4))}/mo</div>
                  </div>
                  <div>
                    <div className="small" style={{ color: featured ? 'rgba(255,255,255,0.6)' : 'var(--neutral-500)' }}>Progress</div>
                    <div className="bold">{pct}%</div>
                  </div>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: featured ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--neutral-100)' }}>
                  <div className="avatar-stack">
                    {FAMILY.slice(0, 4).map(m => <Avatar key={m.id} member={m} size="sm" />)}
                  </div>
                  <button className={'btn ' + (featured ? 'btn-primary' : 'btn-secondary') + ' btn-sm'} onClick={() => setContributingTo(g)}>
                    <Icon name="plus" size={14} stroke={2.4}/> Contribute
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="span-12 grid grid-2">
          {debts.map(d => {
            const pct = Math.round((d.paid / d.total) * 100);
            const remaining = d.total - d.paid;
            return (
              <div key={d.id} className="card">
                <div className="row" style={{ gap: 14, marginBottom: 16, justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: 14 }}>
                    <div className="goal-icon" style={{ width: 56, height: 56, fontSize: 26, background: 'var(--tertiary-warm)' }}>{d.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{d.name}</div>
                      <div className="small muted" style={{ marginTop: 2 }}>{d.rate}% APR · {fmt(d.monthly)}/mo</div>
                    </div>
                  </div>
                  <span className="chip chip-warm">Payoff: {d.payoff}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>{fmt(remaining)}</div>
                <div className="small muted" style={{ marginBottom: 10 }}>remaining of {fmt(d.total)} original balance</div>
                <div className="progress"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
                  <span className="bold small">{pct}% paid off</span>
                  <button className="btn btn-secondary btn-sm">Make a payment</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContributeModal
        goal={contributingTo}
        onClose={() => setContributingTo(null)}
        onContribute={(id, amount, from) => { onContribute(id, amount, from); setContributingTo(null); }}
      />
    </div>
  );
};

Object.assign(window, { GoalsAndDebts });
