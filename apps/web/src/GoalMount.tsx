import { useEffect,useState } from 'react';
import { GoalPanel } from './GoalPanel';
import { listWallets,Wallet } from './lib/api';
export function GoalMount(){const[householdId,setHouseholdId]=useState(()=>localStorage.getItem('arta.householdId')||'');const[wallets,setWallets]=useState<Wallet[]>([]);useEffect(()=>{const timer=window.setInterval(()=>{const next=localStorage.getItem('arta.householdId')||'';setHouseholdId(current=>current===next?current:next)},500);return()=>clearInterval(timer)},[]);useEffect(()=>{if(!householdId){setWallets([]);return}void listWallets(householdId).then(setWallets).catch(()=>setWallets([]))},[householdId]);if(!householdId)return null;return <GoalPanel householdId={householdId} wallets={wallets}/>}
