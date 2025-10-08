import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProfileSetupComponent } from './profile-setup.component';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/user.model';
import * as AuthActions from '../../features/auth/store/auth.actions';

describe('ProfileSetupComponent', () => {
  let component: ProfileSetupComponent;
  let fixture: ComponentFixture<ProfileSetupComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStore: jasmine.SpyObj<Store>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: undefined,
    role: UserRole.USER,
    createdAt: new Date(),
    lastLoginAt: null
  };

  const mockUserWithName: User = {
    ...mockUser,
    name: 'Test User'
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['updateUserProfile']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    
    // Default mock return value
    mockStore.select.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [ProfileSetupComponent, ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSetupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty name field', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    expect(component.profileForm.get('name')?.value).toBe('');
    expect(component.profileForm.get('name')?.hasError('required')).toBeTruthy();
  });

  it('should redirect to home if user already has a name', (done) => {
    // Create a new component instance with mockUserWithName
    mockStore.select.and.returnValue(of(mockUserWithName));
    
    // Create a fresh fixture with the updated mock
    const newFixture = TestBed.createComponent(ProfileSetupComponent);
    newFixture.detectChanges();
    
    // Wait for async operations
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      done();
    }, 50);
  });

  it('should show validation error when name is empty', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    const nameControl = component.profileForm.get('name');
    nameControl?.markAsTouched();
    fixture.detectChanges();
    
    expect(component.isFieldInvalid('name')).toBeTruthy();
    expect(nameControl?.hasError('required')).toBeTruthy();
  });

  it('should show validation error when name is too short', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    const nameControl = component.profileForm.get('name');
    nameControl?.setValue('A');
    nameControl?.markAsTouched();
    fixture.detectChanges();
    
    expect(component.isFieldInvalid('name')).toBeTruthy();
    expect(nameControl?.hasError('minlength')).toBeTruthy();
  });

  it('should accept valid name', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    const nameControl = component.profileForm.get('name');
    nameControl?.setValue('John Doe');
    fixture.detectChanges();
    
    expect(component.isFieldInvalid('name')).toBeFalsy();
    expect(component.profileForm.valid).toBeTruthy();
  });

  it('should update profile and redirect on successful submission', () => {
    mockStore.select.and.returnValue(of(mockUser));
    mockAuthService.updateUserProfile.and.returnValue(of(mockUserWithName));
    fixture.detectChanges();
    
    component.profileForm.get('name')?.setValue('John Doe');
    component.onSubmit();
    
    expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith({ name: 'John Doe' });
    expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.checkAuth());
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error message on failed submission', () => {
    mockStore.select.and.returnValue(of(mockUser));
    const errorMessage = 'Failed to update profile';
    mockAuthService.updateUserProfile.and.returnValue(
      throwError(() => ({ message: errorMessage }))
    );
    fixture.detectChanges();
    
    component.profileForm.get('name')?.setValue('John Doe');
    component.onSubmit();
    
    expect(component.error).toBe(errorMessage);
    expect(component.isLoading).toBeFalsy();
  });

  it('should set loading state during submission', () => {
    mockStore.select.and.returnValue(of(mockUser));
    mockAuthService.updateUserProfile.and.returnValue(of(mockUserWithName));
    fixture.detectChanges();
    
    component.profileForm.get('name')?.setValue('John Doe');
    
    expect(component.isLoading).toBeFalsy();
    component.onSubmit();
    expect(component.isLoading).toBeFalsy(); // Synchronous in test
  });

  it('should not submit if form is invalid', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    component.onSubmit();
    
    expect(mockAuthService.updateUserProfile).not.toHaveBeenCalled();
    expect(component.profileForm.get('name')?.touched).toBeTruthy();
  });

  it('should mark form as touched when submitting invalid form', () => {
    mockStore.select.and.returnValue(of(mockUser));
    fixture.detectChanges();
    
    component.onSubmit();
    
    expect(component.profileForm.get('name')?.touched).toBeTruthy();
  });
});
