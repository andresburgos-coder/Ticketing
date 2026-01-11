import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string, currencyCode: string = 'COP', display: 'symbol' | 'code' = 'symbol', locale: string = 'es-ES'): string {
    if (value === null || value === undefined) return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: display,
    }).format(numValue);
  }
}
