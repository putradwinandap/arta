import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { AuthGate } from './AuthGate';
import { HouseholdOverviewMount } from './HouseholdOverviewMount';
import { BudgetMount } from './BudgetMount';
import { GoalMount } from './GoalMount';
import { ReconciliationMount } from './ReconciliationMount';
import { BackupRestoreMount } from './BackupRestoreMount';
import './styles.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <App />
      <HouseholdOverviewMount />
      <BudgetMount />
      <GoalMount />
      <ReconciliationMount />
      <BackupRestoreMount />
    </AuthGate>
  </React.StrictMode>,
);
