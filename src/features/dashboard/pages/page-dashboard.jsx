// FinLens — Dashboard page

const BudgetRing = ({ spent, total }) => {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: ['Spent', 'Remaining'],
        datasets: [{
          data: [spent, Math.max(total - spent, 0)],
          backgroundColor: ['#25D366', '#EEF1F3'],
          borderWidth: 0,
          borderRadius: 8,
        }],
      },
      options: {
        cutout: '74%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 800 },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [spent, total]);

  const pct = Math.round((spent / total) * 100);
  return (
    <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
      <canvas ref={ref} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>{pct}%</div>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>of {fmt(total)} budget</div>
        </div>
      </div>
    </div>
  );
};

const SpendingBars = ({ data }) => {
  const ref = React.useRef(null);
  const chartRef = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Spent',
            data: data.map(d => Math.round(d.spent)),
            backgroundColor: '#25D366',
            borderRadius: 8,
            barPercentage: 0.55,
          },
          {
            label: 'Budget',
            data: data.map(d => d.budget),
            backgroundColor: '#E6FFDA',
            borderRadius: 8,
            barPercentage: 0.55,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { family: 'Plus Jakarta Sans', size: 12 }, color: '#5C6970', padding: 16 } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: $${c.parsed.y}` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#5C6970' } },
          y: { grid: { color: '#EEF1F3', drawBorder: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#8A969D', callback: v => '$' + v } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  return <div style={{ height: 280 }}><canvas ref={ref} /></div>;
};

const Dashboard = ({ txns, goals, debts, activity }) => {
  const totalBudget = CATEGORIES.reduce((s, c) => s + c.budget, 0);
  const monthSpent = txns.reduce((s, t) => s + t.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const debtTotal = debts.reduce((s, d) => s + d.total, 0);
  const debtPaid = debts.reduce((s, d) => s + d.paid, 0);
  const debtPct = Math.round((debtPaid / debtTotal) * 100);
  const data = BUDGET_BY_CAT(txns);

  const topGoals = goals.slice(0, 3);

  return (
    <div className="grid grid-12">
      {/* Stats row */}
      <div className="span-12 grid grid-4">
        <div className="stat">
          <div className="label"><div className="stat-icon"><Icon name="wallet" size={16}/></div> Spent this month</div>
          <div className="value">{fmt(monthSpent)}</div>
          <div className="delta down"><Icon name="arrow-up" size={12} stroke={2.4}/> 8.2% vs last month</div>
        </div>
        <div className="stat">
          <div className="label"><div className="stat-icon"><Icon name="sparkles" size={16}/></div> Saved this month</div>
          <div className="value">{fmt(840)}</div>
          <div className="delta up"><Icon name="arrow-up" size={12} stroke={2.4}/> 12% vs last month</div>
        </div>
        <div className="stat">
          <div className="label"><div className="stat-icon"><Icon name="target" size={16}/></div> Total saved</div>
          <div className="value">{fmt(totalSaved)}</div>
          <div className="delta up">across {goals.length} goals</div>
        </div>
        <div className="stat">
          <div className="label"><div className="stat-icon"><Icon name="shield" size={16}/></div> Debt payoff</div>
          <div className="value">{debtPct}%</div>
          <div className="delta up">{fmt(debtTotal - debtPaid)} remaining</div>
        </div>
      </div>

      {/* Budget ring + spending bars */}
      <div className="span-5 card">
        <div className="card-header">
          <div>
            <div className="card-title">April budget</div>
            <div className="card-sub">{fmt(monthSpent)} of {fmt(totalBudget)} used</div>
          </div>
          <div className="tab-bar">
            <div className="tab active">Month</div>
            <div className="tab">Quarter</div>
          </div>
        </div>
        <BudgetRing spent={monthSpent} total={totalBudget} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {data.slice(0, 4).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
              <span style={{ color: 'var(--neutral-700)' }}>{c.label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>${Math.round(c.spent)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="span-7 card">
        <div className="card-header">
          <div>
            <div className="card-title">Spending by category</div>
            <div className="card-sub">Actual vs. budgeted, this month</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-outlined btn-sm">Export</button>
            <button className="btn btn-secondary btn-sm">Adjust budget</button>
          </div>
        </div>
        <SpendingBars data={data} />
      </div>

      {/* Goals strip */}
      <div className="span-8 card">
        <div className="card-header">
          <div>
            <div className="card-title">Savings goals</div>
            <div className="card-sub">The whole family is contributing</div>
          </div>
          <button className="btn btn-outlined btn-sm">View all <Icon name="arrow-right" size={14} stroke={2.4}/></button>
        </div>
        <div className="grid grid-3">
          {topGoals.map(g => {
            const pct = Math.round((g.saved / g.target) * 100);
            return (
              <div key={g.id} className={'goal-card ' + (g.tone === 'featured' ? 'featured' : g.tone === 'tint' ? 'tint' : 'warm')}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="goal-icon" style={{ fontSize: 22 }}>{g.icon}</div>
                  <span className={'chip ' + (g.tone === 'featured' ? '' : 'chip-primary')} style={g.tone === 'featured' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}>by {g.due}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>{g.name}</div>
                  <div className="small muted" style={g.tone === 'featured' ? { color: 'rgba(255,255,255,0.65)' } : {}}>{fmt(g.saved)} of {fmt(g.target)}</div>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="bold" style={{ fontSize: 13 }}>{pct}%</span>
                  <div className="avatar-stack">
                    {FAMILY.slice(0, 3).map(m => <Avatar key={m.id} member={m} size="xs" />)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity feed */}
      <div className="span-4 card">
        <div className="card-header">
          <div>
            <div className="card-title">Family activity</div>
            <div className="card-sub">Live across all members</div>
          </div>
          <button className="btn btn-outlined btn-sm btn-icon"><Icon name="dots" size={16}/></button>
        </div>
        <div>
          {activity.slice(0, 6).map((a, i) => {
            const m = memberById(a.who);
            return (
              <div key={i} className="activity-item">
                <Avatar member={m} size="sm" />
                <div style={{ flex: 1 }}>
                  <div className="activity-text"><span className="who">{m.name}</span> {a.text} <span style={{ marginLeft: 4 }}>{a.emoji}</span></div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard });
