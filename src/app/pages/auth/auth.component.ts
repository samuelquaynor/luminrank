import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../../features/auth/components/login/login.component';
import { RegisterComponent } from '../../features/auth/components/register/register.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  showLogin = true;

  toggleView(): void {
    this.showLogin = !this.showLogin;
  }
}

