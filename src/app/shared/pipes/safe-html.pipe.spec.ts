import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    pipe = TestBed.runInInjectionContext(() => new SafeHtmlPipe());
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('marque le HTML comme sûr (bypass sanitizer)', () => {
    const out = pipe.transform('<b>ok</b>');
    expect(sanitizer.sanitize(1 /* SecurityContext.HTML */, out)).toContain('<b>ok</b>');
  });

  it('remplace les espaces insécables parasites', () => {
    const out = pipe.transform('a&nbsp;b&#160;c');
    expect(sanitizer.sanitize(1, out)).toBe('a b c');
  });

  it('tolère null / undefined', () => {
    expect(sanitizer.sanitize(1, pipe.transform(null))).toBe('');
    expect(sanitizer.sanitize(1, pipe.transform(undefined))).toBe('');
  });
});
