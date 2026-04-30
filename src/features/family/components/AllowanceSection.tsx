import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { formatMoney, formatMoney2, formatDate } from '@/lib/format';
import { useHouseholdData } from '@/contexts/HouseholdDataContext';
import {
  getOrCreateWallet,
  inviteMember,
  listEntries,
  recordAllowance,
} from '../api/familyApi';
import type { AllowanceEntry, AllowanceWallet, FamilyMember } from '@/types/db';
import './AllowanceSection.css';

type WalletBundle = {
  member: FamilyMember;
  wallet: AllowanceWallet;
  entries: AllowanceEntry[];
};

type Props = { adminMember: FamilyMember | null; incomeTotal: number };

export function AllowanceSection({ adminMember, incomeTotal }: Props) {
  const { t } = useTranslation();
  const { members, refreshMembers } = useHouseholdData();
  const [bundles, setBundles] = useState<WalletBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<{ bundle: WalletBundle; kind: 'credit' | 'debit' } | null>(null);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const kids = members.filter((m) => m.role === 'Member');
    const result = await Promise.all(
      kids.map(async (m) => {
        const wallet = await getOrCreateWallet(m);
        const entries = await listEntries(wallet.id);
        return { member: m, wallet, entries };
      })
    );
    setBundles(result);
    setLoading(false);
  }, [members]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdjust = async (input: { kind: 'credit' | 'debit'; amount: number; reason: string }) => {
    if (!adjusting) return;
    await recordAllowance({
      wallet: adjusting.bundle.wallet,
      kind: input.kind,
      amount: input.amount,
      reason: input.reason,
      approvedBy: adminMember?.id ?? null,
    });
    setAdjusting(null);
    await load();
  };

  const onInvite = async (input: { name: string; relation: string; age: number | null }) => {
    await inviteMember({
      ...input,
      email: '',
      password: '',
      role: 'Member',
    });
    setInviting(false);
    await refreshMembers();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('income.allowance.title')}</div>
          <div className="card-sub">{t('income.allowance.subtitle')}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setInviting(true)}>
            + {t('income.allowance.addMember')}
          </button>
          <span className="chip chip-primary">🔒 {t('common.adminOnly')}</span>
        </div>
      </div>

      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {bundles.length === 0 && <div className="empty">{t('income.allowance.empty')}</div>}

          {bundles.map((b) => {
            const isOpen = openId === b.member.id;
            return (
              <div key={b.member.id} className="alw-row">
                <div
                  className="alw-row__head"
                  onClick={() => setOpenId(isOpen ? null : b.member.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="avatar">{b.member.name.charAt(0).toUpperCase()}</div>
                  <div className="alw-row__name">
                    <div className="row" style={{ gap: 10 }}>
                      <span className="bold" style={{ fontSize: 14.5 }}>{b.member.name}</span>
                      <span className={`role-badge role-${b.member.role.toLowerCase()}`}>
                        {b.member.role}
                      </span>
                    </div>
                    <div className="tiny muted">{b.member.relation}</div>
                  </div>
                  <div className="alw-row__balance">
                    <div className="tiny muted">{t('income.allowance.wallet')}</div>
                    <div className="bold" style={{ fontSize: 16, color: 'var(--primary-900)' }}>
                      {formatMoney2(b.wallet.balance)}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjusting({ bundle: b, kind: 'credit' });
                    }}
                  >
                    + {t('income.allowance.add')}
                  </button>
                  <button
                    className="btn btn-outlined btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjusting({ bundle: b, kind: 'debit' });
                    }}
                  >
                    × {t('income.allowance.remove')}
                  </button>
                  <span className="alw-row__chev">{isOpen ? '▴' : '▾'}</span>
                </div>

                {isOpen && (
                  <div className="alw-row__body">
                    <div className="bold small" style={{ margin: '12px 0 8px' }}>
                      {t('income.allowance.history')}
                    </div>
                    {b.entries.length === 0 ? (
                      <div className="empty" style={{ padding: 12 }}>
                        {t('income.allowance.noHistory')}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {b.entries.map((h) => (
                          <div key={h.id} className="alw-entry">
                            <div
                              className="alw-entry__icon"
                              style={{
                                background: h.kind === 'credit' ? 'var(--secondary-mint)' : '#FCDDDE',
                                color: h.kind === 'credit' ? 'var(--primary-900)' : 'var(--danger)',
                              }}
                            >
                              {h.kind === 'credit' ? '↓' : '↑'}
                            </div>
                            <div style={{ flex: 1, marginLeft: 10 }}>
                              <div className="bold" style={{ fontSize: 13 }}>{h.reason}</div>
                              <div className="tiny muted">{formatDate(h.entry_date)}</div>
                            </div>
                            <div
                              className="bold"
                              style={{
                                fontSize: 14,
                                color: h.kind === 'credit' ? 'var(--primary-900)' : 'var(--danger)',
                              }}
                            >
                              {h.kind === 'credit' ? '+' : '−'}
                              {formatMoney2(Number(h.amount))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin's own row */}
          {adminMember && (
            <div className="alw-admin">
              <div className="row" style={{ gap: 14 }}>
                <div className="avatar" style={{ background: 'var(--primary)', color: 'var(--neutral-900)' }}>
                  {adminMember.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="bold" style={{ fontSize: 14.5 }}>{adminMember.name}</span>
                    <span className="role-badge role-admin">Admin</span>
                  </div>
                  <div className="tiny" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {adminMember.relation ?? '—'} · {t('income.allowance.adminHint')}
                  </div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div className="tiny" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t('income.allowance.thisMonthIncome')}
                  </div>
                  <div className="bold" style={{ fontSize: 16, color: 'var(--primary)' }}>
                    +{formatMoney(incomeTotal)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AdjustWalletModal
        ctx={adjusting}
        onClose={() => setAdjusting(null)}
        onSave={onAdjust}
      />

      <InviteMemberModal open={inviting} onClose={() => setInviting(false)} onSave={onInvite} />
    </div>
  );
}

function AdjustWalletModal({
  ctx,
  onClose,
  onSave,
}: {
  ctx: { bundle: WalletBundle; kind: 'credit' | 'debit' } | null;
  onClose: () => void;
  onSave: (input: { kind: 'credit' | 'debit'; amount: number; reason: string }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ctx) {
      setAmount('');
      setReason('');
    }
  }, [ctx]);

  if (!ctx) return null;
  const { bundle, kind } = ctx;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!reason.trim() || Number.isNaN(n) || n <= 0) return;
    setBusy(true);
    try {
      await onSave({ kind, amount: n, reason: reason.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!ctx}
      title={
        kind === 'credit'
          ? t('income.allowance.creditTitle', { name: bundle.member.name })
          : t('income.allowance.debitTitle', { name: bundle.member.name })
      }
      subtitle={t('income.allowance.currentBalance', { value: formatMoney2(bundle.wallet.balance) })}
      onClose={onClose}
    >
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="amt">{t('income.allowance.amount')}</label>
          <input
            id="amt"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {[5, 10, 25, 50].map((n) => (
            <button
              type="button"
              key={n}
              className="chip chip-primary"
              style={{ cursor: 'pointer' }}
              onClick={() => setAmount(String(n))}
            >
              {kind === 'credit' ? '+' : '−'}
              {formatMoney(n)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="rsn">{t('income.allowance.reason')}</label>
          <input
            id="rsn"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              kind === 'credit' ? t('income.allowance.reasonCreditPh') : t('income.allowance.reasonDebitPh')
            }
            required
          />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className={'btn btn-sm ' + (kind === 'credit' ? 'btn-primary' : 'btn-inverted')}
            disabled={busy}
          >
            {kind === 'credit' ? '+ ' + t('income.allowance.add') : '× ' + t('income.allowance.deduct')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InviteMemberModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: { name: string; relation: string; age: number | null }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [age, setAge] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setRelation('');
      setAge('');
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        relation: relation.trim() || 'Family',
        age: age ? parseInt(age, 10) : null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={t('income.allowance.inviteTitle')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <div className="field">
          <label htmlFor="nm">{t('common.name')}</label>
          <input id="nm" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="rl">{t('income.allowance.relation')}</label>
          <input
            id="rl"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="Daughter · 14"
          />
        </div>
        <div className="field">
          <label htmlFor="ag">{t('income.allowance.age')}</label>
          <input id="ag" type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-outlined btn-sm" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
