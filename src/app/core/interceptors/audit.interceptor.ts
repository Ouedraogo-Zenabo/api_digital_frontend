import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { AuditService } from '../services/audit.service';

/**
 * Journalise automatiquement toutes les mutations (POST / PUT / PATCH / DELETE)
 * lorsqu'elles aboutissent. Les lectures (GET) ne sont jamais journalisées.
 */
export const auditInterceptor: HttpInterceptorFn = (req, next) => {
  const audit = inject(AuditService);
  const method = req.method.toUpperCase();
  const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

  return next(req).pipe(
    tap(event => {
      if (isMutation && event instanceof HttpResponse) {
        audit.recordHttp(method, req.urlWithParams, event.status, event.body);
      }
    })
  );
};
