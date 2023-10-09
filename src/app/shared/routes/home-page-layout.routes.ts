import { Routes } from '@angular/router';

//Route for content layout without sidebar, navbar and footer for pages like Login, Registration etc...

export const Home_Pages_ROUTES: Routes = [
     {
        path: '',
        loadChildren: () => import('../../pages/home/home-page.module').then(m => m.HomePageModule)
    }
];
