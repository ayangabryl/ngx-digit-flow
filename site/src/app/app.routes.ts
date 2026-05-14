import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then(m => m.HomeComponent),
  },
  {
    path: 'demos',
    loadComponent: () => import('./pages/demos').then(m => m.DemosComponent),
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs').then(m => m.DocsComponent),
  },
  { path: '**', redirectTo: '' },
];
