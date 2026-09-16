import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  archiveWallet, createTransaction, createTransfer, createWallet,
  getFinanceOverview, getHousehold, listBudgets, listMyHouseholds, listWallets,
  updateWallet, type BudgetSummary, type FinanceOverview, type Household,
  type HouseholdMembership, type TransactionKind, type Wallet, type WalletType,
} from "../../../lib/api";

const HOUSEHOLD_STORAGE_KEY = "arta.householdId";
const APP_CACHE_KEY = "arta.appSnapshot";
type AppSnapshot = { userId: string; memberships: HouseholdMembership[]; household: Household; wallets: Wallet[]; overview: FinanceOverview; savedAt: string };
export const walletTypes: Array<{ value: WalletType; label: string }> = [
  { value: "cash", label: "Cash" }, { value: "bank", label: "Bank" },
  { value: "e_wallet", label: "E-Wallet" }, { value: "other", label: "Other" },
];
export function errorMessage(error: unknown) { return error instanceof Error ? error.message.replaceAll("_", " ") : "Something went wrong. Please try again."; }
export function formatMoney(amountMinor: number, currency = "IDR") { return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor); }

export function useFinancialWorkspace() {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]), [transactionBudgetId, setTransactionBudgetId] = useState("");
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([]), [household, setHousehold] = useState<Household | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]), [overview, setOverview] = useState<FinanceOverview>({ balances: [], totals: { incomeMinor: 0, expenseMinor: 0 }, activity: [] });
  const [loading, setLoading] = useState(true), [switching, setSwitching] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine), [showHouseholdManagement, setShowHouseholdManagement] = useState(false);
  const [walletName, setWalletName] = useState(""), [walletType, setWalletType] = useState<WalletType>("cash"), [currency, setCurrency] = useState("IDR");
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null), [editName, setEditName] = useState(""), [editType, setEditType] = useState<WalletType>("cash");
  const [transactionKind, setTransactionKind] = useState<TransactionKind>("expense"), [transactionWalletId, setTransactionWalletId] = useState(""), [transactionAmount, setTransactionAmount] = useState(""), [transactionNote, setTransactionNote] = useState("");
  const [transferSourceId, setTransferSourceId] = useState(""), [transferDestinationId, setTransferDestinationId] = useState(""), [transferAmount, setTransferAmount] = useState(""), [transferNote, setTransferNote] = useState("");
  const activeWallets = useMemo(() => wallets.filter(w => w.status === "active"), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter(w => w.status === "archived"), [wallets]);
  const balanceByWallet = useMemo(() => new Map(overview.balances.map(b => [b.walletId, b])), [overview]);
  async function refresh(id: string) { const [w, o, b] = await Promise.all([listWallets(id), getFinanceOverview(id), listBudgets(id)]); setWallets(w); setOverview(o); setBudgets(b); }
  async function activateHousehold(id: string) { setSwitching(true); setError(""); try { const ms = await listMyHouseholds(); setMemberships(ms); const selected = ms.find(m => m.id === id); if (!selected) throw new Error("household_membership_not_found"); const [h,w,o] = await Promise.all([getHousehold(id), listWallets(id), getFinanceOverview(id)]); localStorage.setItem(HOUSEHOLD_STORAGE_KEY,id); localStorage.setItem("arta.activeHouseholdName",h.name); setHousehold(h); setWallets(w); setOverview(o); setShowHouseholdManagement(false); } catch(e) { setError(errorMessage(e)); } finally { setSwitching(false); } }
  useEffect(() => { listMyHouseholds().then(async ms => { setMemberships(ms); if (!ms.length) { localStorage.removeItem(HOUSEHOLD_STORAGE_KEY); return; } const saved=localStorage.getItem(HOUSEHOLD_STORAGE_KEY), selected=ms.find(m=>m.id===saved)??ms[0]; const [h,w,o]=await Promise.all([getHousehold(selected.id),listWallets(selected.id),getFinanceOverview(selected.id)]); localStorage.setItem(HOUSEHOLD_STORAGE_KEY,selected.id); localStorage.setItem("arta.activeHouseholdName",h.name); setHousehold(h);setWallets(w);setOverview(o); localStorage.setItem(APP_CACHE_KEY,JSON.stringify({userId:localStorage.getItem("arta.activeUserId")||"",memberships:ms,household:h,wallets:w,overview:o,savedAt:new Date().toISOString()} satisfies AppSnapshot)); }).catch(e => { if (!(e instanceof Error&&/^(http_4|unauthenticated)/.test(e.message))) { try { const c=JSON.parse(localStorage.getItem(APP_CACHE_KEY)||"null") as AppSnapshot|null; if(c?.userId&&c.userId===localStorage.getItem("arta.activeUserId")&&c.household?.id&&c.wallets&&c.overview){setMemberships(c.memberships||[]);setHousehold(c.household);setWallets(c.wallets);setOverview(c.overview);setError(`Offline mode. Showing data saved ${new Date(c.savedAt).toLocaleString()}.`);return;} } catch {} } setError(errorMessage(e)); }).finally(()=>setLoading(false)); }, []);
  useEffect(()=>{if(activeWallets.length){if(!transactionWalletId)setTransactionWalletId(activeWallets[0].id);if(!transferSourceId)setTransferSourceId(activeWallets[0].id);if(!transferDestinationId&&activeWallets.length>1)setTransferDestinationId(activeWallets[1].id);}},[activeWallets,transactionWalletId,transferSourceId,transferDestinationId]);
  useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener("online",on);window.addEventListener("offline",off);return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};},[]); useEffect(()=>{document.body.dataset.connection=online?"online":"offline";return()=>{delete document.body.dataset.connection;}},[online]);
  async function action(fn:()=>Promise<void>, after?:()=>void){setSaving(true);setError("");try{await fn();after?.();}catch(e){setError(errorMessage(e));}finally{setSaving(false);}}
  const handleCreateWallet=(e:FormEvent)=>{e.preventDefault();if(household) void action(async()=>{await createWallet(household.id,{name:walletName,type:walletType,currency});await refresh(household.id)},()=>setWalletName(""));};
  const beginEdit=(w:Wallet)=>{setEditingWalletId(w.id);setEditName(w.name);setEditType(w.type);};
  const handleUpdateWallet=(e:FormEvent,id:string)=>{e.preventDefault();if(household)void action(async()=>{await updateWallet(household.id,id,{name:editName,type:editType});await refresh(household.id)},()=>setEditingWalletId(null));};
  const handleArchive=(id:string)=>{if(household)void action(async()=>{await archiveWallet(household.id,id);await refresh(household.id)},()=>setEditingWalletId(null));};
  const handleTransaction=(e:FormEvent)=>{e.preventDefault();if(household)void action(async()=>{await createTransaction(household.id,{walletId:transactionWalletId,kind:transactionKind,amountMinor:Number(transactionAmount),note:transactionNote,...(transactionKind==="expense"&&transactionBudgetId?{budgetId:transactionBudgetId}:{})});await refresh(household.id)},()=>{setTransactionAmount("");setTransactionNote("");});};
  const handleTransfer=(e:FormEvent)=>{e.preventDefault();if(household)void action(async()=>{await createTransfer(household.id,{sourceWalletId:transferSourceId,destinationWalletId:transferDestinationId,amountMinor:Number(transferAmount),note:transferNote});await refresh(household.id)},()=>{setTransferAmount("");setTransferNote("");});};
  return {budgets,setTransactionBudgetId,memberships,household,wallets,overview,loading,switching,saving,error,online,showHouseholdManagement,setShowHouseholdManagement,activeWallets,archivedWallets,balanceByWallet,walletName,setWalletName,walletType,setWalletType,currency,setCurrency,editingWalletId,editName,setEditName,editType,setEditType,transactionKind,setTransactionKind,transactionWalletId,setTransactionWalletId,transactionAmount,setTransactionAmount,transactionNote,setTransactionNote,transferSourceId,setTransferSourceId,transferDestinationId,setTransferDestinationId,transferAmount,setTransferAmount,transferNote,setTransferNote,refresh,activateHousehold,handleCreateWallet,beginEdit,handleUpdateWallet,handleArchive,handleTransaction,handleTransfer,setEditingWalletId};
}
