import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
    form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  
  loading = signal(false);
  success = signal(false);
  error = signal('');
  submitted = signal(false);

  readonly maxMessage = 1000;

  constructor(private apiService: ApiService) {}

  /** Validation au niveau de chaque champ — affichée après une 1ère tentative d'envoi. */
  invalid(field: 'name' | 'email' | 'subject' | 'message'): boolean {
    if (!this.submitted()) return false;
    if (field === 'email') return !this.form.email.trim() || !this.emailValid();
    return !this.form[field]?.trim();
  }

  private emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim());
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (!this.form.name.trim() || !this.form.subject.trim() || !this.form.message.trim() || !this.emailValid()) {
      this.error.set('Veuillez corriger les champs en surbrillance avant l\'envoi.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    
    this.apiService.submitContact(this.form).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set(true);
          this.submitted.set(false);
          this.form = { name: '', email: '', phone: '', subject: '', message: '' };
        } else {
          this.error.set(response.message || 'Une erreur est survenue');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Une erreur est survenue lors de l\'envoi');
        this.loading.set(false);
      }
    });
  }

}
