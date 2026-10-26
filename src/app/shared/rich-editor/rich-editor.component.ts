import { Component, forwardRef, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { UploadService } from '../../core/services/upload.service';

let pdfBlotRegistered = false;

/**
 * Enregistre (une seule fois) un blot Quill « pdfview » qui rend un PDF en
 * prévisualisation réelle (`<iframe>`) directement dans le contenu.
 */
function registerPdfBlot(QuillClass: any): void {
  if (pdfBlotRegistered || !QuillClass) return;
  const BlockEmbed = QuillClass.import('blots/block/embed');

  class PdfBlot extends BlockEmbed {
    static blotName = 'pdfview';
    static tagName = 'div';
    static className = 'pdf-embed';

    static create(value: { url: string; name?: string }) {
      const node: HTMLElement = super.create();
      const name = value?.name || 'Document PDF';
      node.setAttribute('data-url', value.url);
      node.setAttribute('data-name', name);
      node.setAttribute('contenteditable', 'false');
      node.innerHTML =
        `<iframe src="${value.url}#toolbar=1&view=FitH" loading="lazy" title="${name}"></iframe>` +
        `<a href="${value.url}" target="_blank" rel="noopener">📄 Ouvrir « ${name} »</a>`;
      return node;
    }

    static value(node: HTMLElement) {
      return { url: node.getAttribute('data-url') || '', name: node.getAttribute('data-name') || '' };
    }

    html() {
      return (this as any).domNode.outerHTML;
    }
  }

  QuillClass.register(PdfBlot, true);
  pdfBlotRegistered = true;
}

/**
 * Éditeur de texte riche unique du projet (admin + contenus).
 *
 * Remplace `<p-editor>` : mêmes bindings (`[(ngModel)]`, `name`), avec en plus
 * l'insertion d'**images** et de **PDF** téléversés sur le serveur (dossier
 * `uploads/editor/`) — le HTML enregistré ne contient que des URLs, jamais de
 * base64 : la base ne se remplit pas.
 *
 * Rendu public : passer le HTML par le pipe `| safeHtml` pour conserver les
 * `<iframe>` de prévisualisation PDF.
 */
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichEditorComponent), multi: true },
  ],
  template: `
    <div class="rich-editor">
      <p-editor
        [ngModel]="value"
        (onTextChange)="onTextChange($event)"
        (onInit)="onEditorInit($event)"
        [placeholder]="placeholder"
        [style]="{ height: minHeight }">
        <ng-template pTemplate="header">
          <span class="ql-formats">
            <select class="ql-header">
              <option value="2"></option>
              <option value="3"></option>
              <option selected></option>
            </select>
          </span>
          <span class="ql-formats">
            <button type="button" class="ql-bold"></button>
            <button type="button" class="ql-italic"></button>
            <button type="button" class="ql-underline"></button>
          </span>
          <span class="ql-formats">
            <button type="button" class="ql-list" value="ordered"></button>
            <button type="button" class="ql-list" value="bullet"></button>
            <button type="button" class="ql-blockquote"></button>
          </span>
          <span class="ql-formats">
            <button type="button" class="ql-link"></button>
            <button type="button" class="ql-image" title="Insérer une image"></button>
            <button type="button" class="ql-pdf" title="Insérer un PDF ou un fichier">
              <svg viewBox="0 0 18 18" width="16" height="16">
                <path class="ql-stroke" d="M12 3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6z"></path>
                <path class="ql-stroke" d="M12 3v3h3"></path>
              </svg>
            </button>
          </span>
          <span class="ql-formats">
            <button type="button" class="ql-clean"></button>
          </span>
        </ng-template>
      </p-editor>

      @if (uploading()) {
        <p class="text-xs text-[#00843B] mt-1 flex items-center gap-1">
          <span class="inline-block w-3 h-3 border-2 border-[#00843B]/30 border-t-[#00843B] rounded-full animate-spin"></span>
          Téléversement du fichier…
        </p>
      }
      @if (error()) {
        <p class="text-xs text-red-600 mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class RichEditorComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() minHeight = '260px';

  private uploadSvc = inject(UploadService);

  value: string | null = '';
  uploading = signal(false);
  error = signal('');

  private quill: any;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: string | null): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onTextChange(e: { htmlValue: string | null }): void {
    this.value = e.htmlValue;
    this.onChange(e.htmlValue);
    this.onTouched();
  }

  onEditorInit(e: { editor: any }): void {
    this.quill = e.editor;
    registerPdfBlot(this.quill?.constructor);

    // Collage depuis Word / un PDF : remplace les espaces insécables parasites.
    const nbsp = new RegExp(String.fromCharCode(160), 'g');
    this.quill.clipboard?.addMatcher(Node.TEXT_NODE, (_node: any, delta: any) => {
      delta.ops = (delta.ops || []).map((op: any) =>
        typeof op.insert === 'string'
          ? { ...op, insert: op.insert.replace(nbsp, ' ') }
          : op);
      return delta;
    });

    const toolbar = this.quill.getModule('toolbar');
    toolbar.addHandler('image', () => this.pick('image/*'));

    const pdfBtn: HTMLButtonElement | null = toolbar.container?.querySelector('button.ql-pdf');
    pdfBtn?.addEventListener('click', () =>
      this.pick('.pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods'));

    // Coller / déposer une image → téléversement (au lieu d'un base64 géant).
    this.quill.root.addEventListener('paste', (ev: ClipboardEvent) => this.handlePasteOrDrop(ev, ev.clipboardData));
    this.quill.root.addEventListener('drop', (ev: DragEvent) => this.handlePasteOrDrop(ev, ev.dataTransfer));
  }

  private handlePasteOrDrop(ev: Event, dt: DataTransfer | null): void {
    const file = Array.from(dt?.files ?? []).find(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (!file) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.uploadAndInsert(file);
  }

  private pick(accept: string): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (f) this.uploadAndInsert(f);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  }

  private uploadAndInsert(file: File): void {
    this.error.set('');
    this.uploading.set(true);
    this.uploadSvc.upload(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        const url = this.uploadSvc.absolute(res.url);
        const range = this.quill.getSelection(true) || { index: this.quill.getLength(), length: 0 };
        if (res.isImage) {
          this.quill.insertEmbed(range.index, 'image', url, 'user');
          this.quill.setSelection(range.index + 1, 0, 'user');
        } else if (res.isPdf) {
          this.quill.insertEmbed(range.index, 'pdfview', { url, name: res.name }, 'user');
          this.quill.setSelection(range.index + 2, 0, 'user');
        } else {
          this.quill.insertText(range.index, res.name, { link: url }, 'user');
          this.quill.setSelection(range.index + res.name.length, 0, 'user');
        }
      },
      error: () => {
        this.uploading.set(false);
        this.error.set("Échec du téléversement (type non autorisé ou fichier trop lourd).");
      },
    });
  }
}
