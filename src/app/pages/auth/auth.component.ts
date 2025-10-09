import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription } from 'rxjs';
import { LoginComponent } from '../../features/auth/components/login/login.component';
import { RegisterComponent } from '../../features/auth/components/register/register.component';
import * as AuthActions from '../../features/auth/store/auth.actions';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {
  showLogin = true;
  private subscription = new Subscription();

  constructor(
    private actions$: Actions,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Handle navigation after successful login
    this.subscription.add(
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess)
      ).subscribe(({ response }) => {
        if (!response.user.name) {
          this.router.navigate(['/profile-setup']);
        } else {
          this.router.navigate(['/']);
        }
      })
    );

    // Handle navigation after successful registration
    this.subscription.add(
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess)
      ).subscribe(() => {
        this.router.navigate(['/profile-setup']);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleView(): void {
    this.showLogin = !this.showLogin;
  }
}

