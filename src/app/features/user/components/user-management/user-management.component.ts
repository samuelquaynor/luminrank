import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { User, UserRole, CreateUserData } from '../../models/user.model';
import * as UserActions from '../../store/user.actions';
import * as UserSelectors from '../../store/user.selectors';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users$: Observable<User[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  canManageUsers$: Observable<boolean>;
  
  userForm: FormGroup;
  selectedUser: User | null = null;
  showCreateForm = false;
  searchTerm = '';
  
  // Make UserRole available in template
  UserRole = UserRole;
  
  private subscription = new Subscription();

  constructor(
    private store: Store,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.USER, Validators.required]
    });

    this.users$ = this.store.select(UserSelectors.selectUsers);
    this.loading$ = this.store.select(UserSelectors.selectUserLoading);
    this.error$ = this.store.select(UserSelectors.selectUserError);
    this.canManageUsers$ = this.store.select(UserSelectors.selectCanManageUsers);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadUsers(): void {
    this.store.dispatch(UserActions.loadUsers({ page: 1, limit: 50 }));
  }

  createUser(): void {
    if (this.userForm.valid) {
      const userData: CreateUserData = this.userForm.value;
      this.store.dispatch(UserActions.createUser({ userData }));
      this.resetForm();
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  updateUser(user: User): void {
    const userData = {
      name: user.name,
      role: user.role,
      isActive: user.isActive
    };
    
    this.store.dispatch(UserActions.updateUser({ 
      id: user.id, 
      userData 
    }));
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.store.dispatch(UserActions.deleteUser({ id: user.id }));
    }
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.store.dispatch(UserActions.selectUser({ user }));
  }

  toggleUserStatus(user: User): void {
    const userData = { isActive: !user.isActive };
    this.store.dispatch(UserActions.updateUser({ 
      id: user.id, 
      userData 
    }));
  }

  searchUsers(): void {
    if (this.searchTerm.trim()) {
      this.store.dispatch(UserActions.searchUsers({ searchTerm: this.searchTerm }));
    } else {
      this.loadUsers();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadUsers();
  }

  resetForm(): void {
    this.userForm.reset();
    this.userForm.patchValue({ role: UserRole.USER });
    this.showCreateForm = false;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getRoleBadgeClass(role: UserRole): string {
    return role === UserRole.ADMIN ? 'badge-admin' : 'badge-user';
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  clearError(): void {
    this.store.dispatch(UserActions.clearUserError());
  }
}
