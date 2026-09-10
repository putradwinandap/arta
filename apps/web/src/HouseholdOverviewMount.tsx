import { useEffect, useMemo, useState } from 'react';
import { getFinanceOverview, listWallets, type FinanceOverview, type Wallet } from './lib/api';

const money = (value:number,currency:string) => new Intl.NumberFormat('id-ID',{style:'currency',currency,maximumFractionDigits:0}).format(value/100);

export function HouseholdOverviewMount(){
  const [householdId,setHouseholdId]=useState(localStorage.getItem('arta.householdId')||'');
  useEffect(()=>{const timer=setInterval(()=>setHouseholdId(localStorage.getItem('arta.householdId')||''),500);return()=>clearInterval(timer)},[]);
  if(!householdId)return null;
  return <HouseholdOverview householdId={householdId}/>;
}

function HouseholdOverview({householdId}:{householdId:string}){
  const [overview,setOverview]=useState<FinanceOverview|null>(null);
  const [wallets,setWallets]=useState<Wallet[]>([]);
  const [error,setError]=useState('');
  useEffect(()=>{Promise.all([getFinanceOverview(householdId),listWallets(householdId)]).then(([o,w])=>{setOverview(o);setWallets(w);setError('')}).catch(e=>setError(e instanceof Error?e.message:'overview_failed'))},[householdId]);
  const names=useMemo(()=>new Map(wallets.map(w=>[w.id,w.name])),[wallets]);
  if(error)return <section className="panel"><p className="error">{error}</p></section>;
  if(!overview)return <section className="panel"><p className="muted">Loading household overview…</p></section>;
  const budgets=overview.currentBudgets??[], goals=overview.activeGoals??[], activity=overview.recentActivity??overview.activity;
  return <section className="panel overview-panel">
    <div className="section-heading"><div><p className="eyebrow">Household overview</p><h2>Your financial position</h2><p className="muted">Physical money, reserved goals, spendable funds, plans, and recent confirmed activity in one view.</p></div></div>
    {overview.balances.length===0?<div className="empty-state"><p>Add a wallet to start your household overview.</p></div>:<div className="finance-summary">{overview.balances.map(b=><article className="summary-card" key={b.walletId}><span>{names.get(b.walletId)??'Wallet'} · {b.currency}</span><strong>{money(b.amountMinor,b.currency)}</strong><small>Reserved {money(b.reservedMinor??0,b.currency)} · Available {money(b.availableMinor??b.amountMinor,b.currency)}</small></article>)}</div>}
    <div className="layout-grid"><div><p className="eyebrow">Current budgets</p>{budgets.length===0?<div className="empty-state"><p>No budget covers today.</p></div>:budgets.map(b=><article className="card" key={b.id}><strong>{b.currency} budget</strong><p>{money(b.spentMinor,b.currency)} spent of {money(b.amountMinor,b.currency)}</p><small>{money(b.remainingMinor,b.currency)} remaining</small></article>)}</div><div><p className="eyebrow">Active goals</p>{goals.length===0?<div className="empty-state"><p>No active financial goals yet.</p></div>:goals.map(g=><article className="card" key={g.id}><strong>{g.name}</strong><p>{money(g.reservedMinor,g.currency)} reserved of {money(g.targetAmountMinor,g.currency)}</p><small>{money(g.remainingMinor,g.currency)} remaining</small></article>)}</div></div>
    <div><p className="eyebrow">Recent activity</p>{activity.length===0?<div className="empty-state"><p>No confirmed activity yet.</p></div>:<div className="activity-list">{activity.map(item=><article className="activity-row" key={item.id}><div><strong>{item.type==='transfer'?`${names.get(item.sourceWalletId??'')??'Wallet'} → ${names.get(item.destinationWalletId??'')??'Wallet'}`:`${item.type==='income'?'Income':'Expense'} · ${names.get(item.walletId??'')??'Wallet'}`}</strong><p className="muted">{item.note||new Date(item.occurredAt).toLocaleString()}</p></div><strong>{item.type==='expense'?'-':''}{money(item.amountMinor,item.currency)}</strong></article>)}</div>}</div>
  </section>;
}
