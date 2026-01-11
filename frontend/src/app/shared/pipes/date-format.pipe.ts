import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
      year: format === 'long' ? 'numeric' : undefined,
      hour: format !== 'short' ? 'numeric' : undefined,
      minute: format !== 'short' ? '2-digit' : undefined,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
}
